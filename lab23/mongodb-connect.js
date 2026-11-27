
require('dotenv').config();

const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

const client = new MongoClient(uri, {
    heartbeatFrequencyMS: 10000,
    serverSelectionTimeoutMS: 5000
});

client.on('serverHeartbeatSucceeded', () => {
    console.log(`[HEARTBEAT] Успешно: ${new Date().toISOString()}`);
});

client.on('serverHeartbeatFailed', (event) => {
    console.error(
        `[HEARTBEAT] Ошибка: ${event.failure?.message || 'Нет соединения'}`
    );
});

async function main() {
    console.log('=== Подключение к MongoDB ===');

    try {
        await client.connect();

        console.log('✔ Подключение установлено');

        const db = client.db(dbName);

        const ping = await db.command({ ping: 1 });

        console.log('Проверка соединения:', ping.ok === 1 ? 'OK' : 'Ошибка');
        console.log('База данных:', dbName);

        console.log('\n=== Информация о сервере ===');

        const admin = client.db('admin');

        const buildInfo = await admin.command({ buildInfo: 1 });

        console.log('Версия MongoDB:', buildInfo.version);

        const databases = await admin.command({ listDatabases: 1 });

        console.log('Список баз данных:');

        for (const database of databases.databases) {
            console.log(' -', database.name);
        }

        console.log(`\nКоллекции в ${dbName}:`);

        const collections = await db.listCollections().toArray();

        if (collections.length === 0) {
            console.log(' (пусто — коллекции ещё не созданы)');
        } else {
            for (const collection of collections) {
                console.log(' -', collection.name);
            }
        }

        console.log('\n=== Heartbeat ===');
        console.log('Проверка доступности сервера каждые 10 секунд.');
        console.log('Для завершения нажмите Ctrl+C.');

        await new Promise(() => {});

    } catch (error) {
        console.error('\n✖ Ошибка подключения:', error.message);
        process.exitCode = 1;
    } finally {
        if (process.exitCode) {
            await client.close();
        }
    }
}

process.on('SIGINT', async () => {
    console.log('\n[INFO] Закрытие соединения...');
    await client.close();
    console.log('✖ Соединение закрыто');
    process.exit(0);
});

main();
