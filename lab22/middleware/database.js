
const pool = require('../config/db');

async function database(ctx, next) {
    ctx.db = pool;
    await next();
}

module.exports = database;
