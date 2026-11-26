
const mysql = require('mysql2');
const mysqlPromise = require('mysql2/promise');
const path = require('path');

require('dotenv').config({
    path: path.join(__dirname, '.env')
});

const config = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

let pool;

function logError(error) {
    console.log(`[${error.code || 'ERROR'}] ${error.message}`);
}

async function demonstrateErrors() {
    console.log('\n=== Демонстрация ошибок ===');

    // 1. Несуществующий порт
    try {
        const connection = await mysqlPromise.createConnection({
            ...config,
            port: 9999,
            connectTimeout: 3000
        });
        await connection.end();
    } catch (error) {
        console.log('[Сетевая ошибка]');
        logError(error);
    }

    // 2. Неверный пароль
    try {
        const connection = await mysqlPromise.createConnection({
            ...config,
            password: 'wrong_password'
        });
        await connection.end();
    } catch (error) {
        console.log('[Ошибка авторизации]');
        logError(error);
    }

    // 3. Ошибка SQL
    try {
        await pool.query('SELECT * FRM students');
    } catch (error) {
        console.log('[Ошибка синтаксиса SQL]');
        logError(error);
    }

    // Подготовка таблицы для проверки ограничений
    await pool.query(`
        CREATE TABLE IF NOT EXISTS error_demo (
            id INT PRIMARY KEY,
            name VARCHAR(100) NOT NULL
        ) ENGINE=InnoDB
    `);

    await pool.query('DELETE FROM error_demo');

    // 4. Дублирование первичного ключа
    try {
        await pool.execute(
            'INSERT INTO error_demo (id, name) VALUES (?, ?)',
            [1, 'Первый студент']
        );

        await pool.execute(
            'INSERT INTO error_demo (id, name) VALUES (?, ?)',
            [1, 'Дубликат']
        );
    } catch (error) {
        console.log('[Ошибка дублирования]');
        logError(error);
    }

    // 5. NULL в NOT NULL
    try {
        await pool.execute(
            'INSERT INTO error_demo (id, name) VALUES (?, ?)',
            [2, null]
        );
    } catch (error) {
        console.log('[Ошибка ограничения NOT NULL]');
        logError(error);
    }
}

async function demonstratePoolErrors() {
    console.log('\n=== Обработка ошибок пула ===');

   pool.pool.on('error', (error) => {
    console.log('[POOL ERROR]', error.code);
});
    console.log('[POOL] Обработчик ошибок установлен');

    console.log('[POOL] Проверка соединения...');
    await pool.query('SELECT 1');

    console.log('[POOL] Соединение работает');

    console.log('[POOL] При критической ошибке пул можно пересоздать');
}

async function createBigData() {
    console.log('\n=== Подготовка big_data ===');

    await pool.query(`
        CREATE TABLE IF NOT EXISTS big_data (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(100) NOT NULL,
            group_name VARCHAR(20) NOT NULL,
            grade DECIMAL(3,2)
        ) ENGINE=InnoDB
    `);

    const [rows] = await pool.query(
        'SELECT COUNT(*) AS total FROM big_data'
    );

    const existing = rows[0].total;

    if (existing < 100000) {
        console.log(`Добавляем записи. Уже имеется: ${existing}`);

        for (let start = existing; start < 100000; start += 1000) {
            const values = [];
            const count = Math.min(1000, 100000 - start);

            for (let i = 0; i < count; i++) {
                const number = start + i + 1;

                values.push([
                    `Студент ${number}`,
                    'ББМО-01-23',
                    (3 + (number % 20) / 10).toFixed(2)
                ]);
            }

            await pool.query(
                `INSERT INTO big_data (name, group_name, grade)
                 VALUES ?`,
                [values]
            );

            if ((start + count) % 10000 === 0) {
                console.log(
                    `[INSERT] Добавлено: ${start + count} записей`
                );
            }
        }
    } else {
        console.log('В таблице уже достаточно записей:', existing);
    }
}

async function streamData() {
    console.log('\n=== Потоковый запрос ===');
    console.log('Чтение 100000 записей...');

    const connection = mysql.createConnection(config);

    let count = 0;
    const startMemory = process.memoryUsage().heapUsed;
    const startTime = Date.now();

    const query = connection.query(
        'SELECT * FROM big_data LIMIT 100000'
    );

    const stream = query.stream({ highWaterMark: 1000 });

    

return new Promise((resolve, reject) => {
    stream.on('data', (row) => {
        count++;

        if (count % 10000 === 0) {
            console.log(
                `[STREAM] Получено: ${count} (${count / 1000}%)`
            );
        }
    });

    stream.on('end', () => {
        const time = ((Date.now() - startTime) / 1000).toFixed(2);
        const memory = (
            (process.memoryUsage().heapUsed - startMemory) /
            1024 / 1024
        ).toFixed(2);

        console.log(`✔ Обработано записей: ${count}`);
        console.log(`Время: ${time} сек`);
        console.log(`Изменение памяти: ${memory} МБ`);

        connection.end();
        resolve();
    });

    stream.on('error', (error) => {
        console.error('[STREAM ERROR]', error.message);
        connection.destroy();
        reject(error);
    });
});
}

async function compareMemory() {
    console.log('\n=== Сравнение памяти ===');

    const before = process.memoryUsage().heapUsed;

    const [rows] = await pool.query(
        'SELECT * FROM big_data LIMIT 100000'
    );

    const after = process.memoryUsage().heapUsed;

    const used = ((after - before) / 1024 / 1024).toFixed(2);

    console.log('Получено записей:', rows.length);
    console.log('Изменение heapUsed:', used, 'МБ');

    rows.length = 0;

    console.log(
        'При обычном SELECT все полученные строки находятся в памяти одновременно.'
    );
    console.log(
        'При stream() строки обрабатываются постепенно.'
    );
}

async function demonstrateTransaction() {
    console.log('\n=== Транзакция ===');

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        console.log('Начало транзакции');

        await connection.execute(
            `INSERT INTO students
             (name, group_name, course, grade)
             VALUES (?, ?, ?, ?)`,
            ['Тестовый студент 1', 'ББМО-01-23', 2, 4.5]
        );

        console.log('✔ INSERT 1 выполнен');

        await connection.execute(
            `INSERT INTO students
             (name, group_name, course, grade)
             VALUES (?, ?, ?, ?)`,
            ['Тестовый студент 2', 'ББМО-01-23', 2, 4.2]
        );

        console.log('✔ INSERT 2 выполнен');

        // Ошибка: повторное значение первичного ключа
        await connection.execute(
            `INSERT INTO error_demo (id, name)
             VALUES (?, ?)`,
            [1, 'Повторный ключ']
        );

        await connection.commit();
        console.log('COMMIT выполнен');

    } catch (error) {
        console.log('✖ INSERT 3 не выполнен:', error.code);

        await connection.rollback();
        console.log('✔ Rollback выполнен');

    } finally {
        connection.release();
        console.log('Соединение возвращено в пул');
    }
}

async function main() {
    try {
        pool = mysqlPromise.createPool({
    ...config,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

        console.log('✔ Пул MySQL создан');

        await demonstrateErrors();
        await demonstratePoolErrors();
        await createBigData();
        await streamData();



        await compareMemory();
        await demonstrateTransaction();

    } catch (error) {
        console.error('[MAIN ERROR]', error.code, error.message);
    } finally {
        if (pool) {
            await pool.end();
            console.log('\nПул соединений закрыт');
        }
    }
}

main();
