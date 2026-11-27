
const mysql = require('mysql2/promise');
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

function showError(error) {
    if (error.code === 'ECONNREFUSED') {
        console.error('[ECONNREFUSED] Сервер MySQL недоступен');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        console.error('[ER_ACCESS_DENIED_ERROR] Неверный пользователь или пароль');
    } else {
        console.error('[ERROR]', error.message);
    }
}

async function singleConnection() {
    console.log('\n=== Одиночное соединение ===');

    let connection;

    try {
        connection = await mysql.createConnection(config);

        console.log('✔ Подключение установлено');

        const [rows] = await connection.query(`
            SELECT
                VERSION() AS version,
                DATABASE() AS current_db,
USER() AS db_user
        `);

        console.log('Версия MySQL:', rows[0].version);
        console.log('Текущая БД:', rows[0].current_db);
        console.log('Пользователь:', rows[0].db_user);
    } catch (error) {
        showError(error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('✖ Соединение закрыто');
        }
    }
}

async function poolConnection() {
    console.log('\n=== Пул соединений ===');

    const pool = mysql.createPool({
        ...config,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        console.log('✔ Пул создан (лимит: 10)');

        const [rows] = await pool.query(`
            SELECT
                VERSION() AS version,
                DATABASE() AS current_db,
                USER() AS db_user
        `);

        console.log('Версия MySQL:', rows[0].version);
        console.log('Текущая БД:', rows[0].current_db);
        console.log('Пользователь:', rows[0].db_user);

        console.log('\n✔ Пул готов к работе');
        console.log('Пул остаётся открытым для следующих запросов.');
        return pool;
    } catch (error) {
        showError(error);
        await pool.end();
        return null;
    }
}

async function main() {
    await singleConnection();
    await poolConnection();
}

main().catch(showError);
