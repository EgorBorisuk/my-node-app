const { MongoClient } = require('mongodb');

let client;
let database;

async function connectDB() {
    if (database) {
        return database;
    }

    const uri = process.env.MONGODB_URI;
    const dbName = process.env.DB_NAME;

    client = new MongoClient(uri);

    await client.connect();

    database = client.db(dbName);

    console.log('[INFO] MongoDB подключена');

    return database;
}

function getDB() {
    if (!database) {
        throw new Error('База данных не подключена');
    }

    return database;
}

function getClient() {
    return client;
}

module.exports = {
    connectDB,
    getDB,
    getClient
};