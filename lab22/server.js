
require('dotenv').config();

const Koa = require('koa');
const bodyParser = require('koa-bodyparser');

const pool = require('./config/db');
const database = require('./middleware/database');
const errorHandler = require('./middleware/errorHandler');

const {
    attachLogger,
    getMetrics
} = require('./middleware/logger');

const {
    cacheMiddleware,
    getCacheStats
} = require('./middleware/cache');

const studentsRouter = require('./routes/students');
const groupsRouter = require('./routes/groups');

const app = new Koa();
const PORT = 3000;

attachLogger(pool);

app.use(errorHandler);

app.use(bodyParser({
    jsonLimit: '1mb'
}));

app.use(database);
app.use(cacheMiddleware);

app.use(studentsRouter.routes());
app.use(studentsRouter.allowedMethods());

app.use(groupsRouter.routes());
app.use(groupsRouter.allowedMethods());

app.use(async (ctx, next) => {
    if (ctx.path === '/api/metrics' && ctx.method === 'GET') {
        ctx.body = {
            ...getMetrics(),
            cacheHitRate: getCacheStats().hitRate
        };
        return;
    }

    if (ctx.path === '/api/cache/stats' && ctx.method === 'GET') {
        ctx.body = getCacheStats();
        return;
    }

    await next();
});

app.use(async (ctx) => {
    ctx.status = 404;
    ctx.body = {
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: 'Маршрут не найден'
        }
    };
});

async function start() {
    try {
        await pool.query('SELECT 1');

        console.log('[INFO] Пул MySQL создан (лимит: 10)');

        const [migrations] = await pool.query(
            'SELECT COUNT(*) AS total FROM migrations'
        );

        console.log(
            `[INFO] Миграции применены: ${migrations[0].total}`
        );

        app.listen(PORT, () => {
            console.log(`[INFO] Koa-сервер запущен на порту ${PORT}`);
            console.log('[INFO] Группа: ББМО-01-23');
        });
    } catch (error) {
        console.error('[START ERROR]', error);
        process.exit(1);
    }
}

start();

process.on('SIGINT', async () => {
    console.log('\n[INFO] Завершение работы сервера');
    await pool.end();
    process.exit(0);
});

