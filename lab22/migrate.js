
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const pool = require('./config/db');

async function migrate() {
    const connection = await pool.getConnection();

    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                filename VARCHAR(255) NOT NULL UNIQUE,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const directory = path.join(__dirname, 'migrations');

        const files = fs.readdirSync(directory)
            .filter(file => file.endsWith('.sql'))
            .sort();

        for (const file of files) {
            const [existing] = await connection.execute(
                'SELECT id FROM migrations WHERE filename = ?',
                [file]
            );

            if (existing.length > 0) {
                console.log(`[SKIP] ${file} уже применена`);
                continue;
            }

            const sql = fs.readFileSync(
                path.join(directory, file),
                'utf8'
            );

            await connection.query(sql);

            await connection.execute(
                'INSERT INTO migrations (filename) VALUES (?)',
                [file]
            );

            console.log(`[OK] Применена миграция: ${file}`);
        }

        console.log('Миграции завершены');
    } catch (error) {
        console.error('[MIGRATION ERROR]', error.message);
        process.exitCode = 1;
    } finally {
        connection.release();
        await pool.end();
    }
}

migrate();
