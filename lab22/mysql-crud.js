
const mysql = require('mysql2/promise');
const path = require('path');

require('dotenv').config({
    path: path.join(__dirname, '.env')
});

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const GROUP = 'ББМО-01-23';

async function createTable() {
    console.log('\n=== Создание таблицы ===');

    await pool.query(`
        CREATE TABLE IF NOT EXISTS students (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(100) NOT NULL,
            group_name VARCHAR(20) NOT NULL,
            course INT NOT NULL,
            grade DECIMAL(3,2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
        DEFAULT CHARSET=utf8mb4
    `);

    console.log('✔ Таблица students создана');
}

async function insertStudents() {
    console.log('\n=== INSERT ===');

    const [single] = await pool.execute(
        `INSERT INTO students (name, group_name, course, grade)
         VALUES (?, ?, ?, ?)`,
        ['Егор Борисюк Александрович', GROUP, 3, 4.80]
    );

    console.log(
        `✔ Вставлен студент: id=${single.insertId}, affectedRows=${single.affectedRows}`
    );

    const [multiple] = await pool.query(
        `INSERT INTO students (name, group_name, course, grade)
         VALUES (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?)`,
        [
            'Иван', GROUP, 2, 4.50,
            'Мария', GROUP, 2, 3.80,
            'Петр', GROUP, 3, 4.20
        ]
    );

    console.log(
        `✔ Вставлено 3 студента: affectedRows=${multiple.affectedRows}`
    );
}

async function selectStudents() {
    console.log('\n=== SELECT ===');

    const [all] = await pool.execute(
        'SELECT * FROM students ORDER BY id DESC LIMIT 10'
    );

    console.log('Последние студенты:');

    all.forEach(student => {
        console.log(
            `id=${student.id}, name=${student.name}, ` +
            `group=${student.group_name}, grade=${student.grade}`
        );
    });

    const [filtered] = await pool.execute(
        `SELECT * FROM students
         WHERE group_name = ?
         ORDER BY grade DESC`,
        [GROUP]
    );

    console.log(`\nСтуденты группы ${GROUP} (по оценке):`);

    filtered.forEach(student => {
        console.log(
            `id=${student.id}, name=${student.name}, grade=${student.grade}`
        );
    });

    const [page] = await pool.execute(
        `SELECT * FROM students
         WHERE group_name = ?
         ORDER BY id
         LIMIT ? OFFSET ?`,
        [GROUP, 2, 0]
    );

    console.log('\nПагинация (2 записи, страница 1):');

    page.forEach(student => {
        console.log(`id=${student.id}, name=${student.name}`);
    });
}

async function updateStudent() {
    console.log('\n=== UPDATE ===');

    const [students] = await pool.execute(
        `SELECT id, grade FROM students
         WHERE name = ?
         ORDER BY id DESC LIMIT 1`,
        ['Егор Борисюк Александрович']
    );

    if (students.length === 0) {
        console.log('Студент для обновления не найден');
        return;
    }

    const id = students[0].id;

    const [first] = await pool.execute(
        'UPDATE students SET grade = ? WHERE id = ?',
        [4.90, id]
    );

    console.log(
        `✔ Обновлён студент id=${id}: ` +
        `affectedRows=${first.affectedRows}, changedRows=${first.changedRows}`
    );

    const [second] = await pool.execute(
        'UPDATE students SET grade = ? WHERE id = ?',
        [4.90, id]
    );

    console.log(
        `✔ Повторное обновление: ` +
        `affectedRows=${second.affectedRows}, changedRows=${second.changedRows}`
    );
}

async function deleteStudent() {
    console.log('\n=== DELETE ===');

    const [students] = await pool.execute(
        `SELECT id FROM students
         WHERE name = ?
         ORDER BY id DESC LIMIT 1`,
        ['Егор Борисюк Александрович']
    );

    if (students.length === 0) {
        console.log('Студент для удаления не найден');
        return;
    }

    const [result] = await pool.execute(
        'DELETE FROM students WHERE id = ?',
        [students[0].id]
    );

    console.log(
        `✔ Удалён студент id=${students[0].id}: ` +
        `affectedRows=${result.affectedRows}`
    );
}

async function sqlInjectionDemo() {
    console.log('\n=== Защита от SQL-инъекции ===');

    const maliciousInput = "'; DROP TABLE students; --";

    console.log('Попытка инъекции:', maliciousInput);

    const [rows] = await pool.execute(
        'SELECT * FROM students WHERE name = ?',
        [maliciousInput]
    );

    console.log(
        '✔ Параметризованный запрос безопасен. Найдено записей:',
        rows.length
    );

    const unsafeQuery =
        `SELECT * FROM students WHERE name = '${maliciousInput}'`;

    console.log('\nПример небезопасной конкатенации:');
    console.log(unsafeQuery);
    console.log('✖ Такой запрос может привести к SQL-инъекции');
    console.log('Небезопасный запрос намеренно не выполняется.');
}

async function main() {
    try {
        await createTable();
        await insertStudents();
        await selectStudents();
        await updateStudent();
        await deleteStudent();
        await sqlInjectionDemo();
    } catch (error) {
        console.error('[ERROR]', error.message);
    } finally {
        await pool.end();
        console.log('\nСоединения с MySQL закрыты');
    }
}

main();
