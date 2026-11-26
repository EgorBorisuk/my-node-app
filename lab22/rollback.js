
require('dotenv').config();

const pool = require('./config/db');

async function rollback() {
    const connection = await pool.getConnection();

    try {
        const [rows] = await connection.query(
            'SELECT filename FROM migrations ORDER BY id DESC LIMIT 1'
        );

        if (!rows.length) {
            console.log('Нет миграций для отката');
            return;
        }

        const filename = rows[0].filename;

        if (filename === '002_create_groups.sql') {
            await connection.query('DROP TABLE IF EXISTS `groups`');
        } else if (filename === '001_create_students.sql') {
            await connection.query('DROP TABLE IF EXISTS students');
        } else {
            throw new Error('Неизвестная миграция: ' + filename);
        }

        await connection.execute(
            'DELETE FROM migrations WHERE filename = ?',
            [filename]
        );

        console.log(`[OK] Откат выполнен: ${filename}`);
    } catch (error) {
        console.error('[ROLLBACK ERROR]', error.message);
        process.exitCode = 1;
    } finally {
        connection.release();
        await pool.end();
    }
}

rollback();
