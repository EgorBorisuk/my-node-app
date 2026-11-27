const { getDB, getClient } = require('../db');

async function dbMiddleware(ctx, next) {
    ctx.db = getDB();
    ctx.mongoClient = getClient();

    await next();
}

module.exports = dbMiddleware;