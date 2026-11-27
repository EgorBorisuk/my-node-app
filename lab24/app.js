require('dotenv').config();

const Koa = require('koa');
const bodyParser = require('koa-bodyparser');

const usersRouter = require('./routes/users');

const { connectDB } = require('./db');

const errorMiddleware = require('./middleware/errorMiddleware');
const dbMiddleware = require('./middleware/dbMiddleware');
const loggerMiddleware = require('./middleware/loggerMiddleware');

const app = new Koa();

const PORT = process.env.PORT || 3000;
const GROUP_NAME = 'BBMO-01-23';

// Централизованная обработка ошибок
app.use(errorMiddleware);

// Логирование запросов
app.use(loggerMiddleware);

// Заголовок группы
app.use(async (ctx, next) => {
    ctx.set('X-Group', GROUP_NAME);
    await next();
});

// Обработка JSON
app.use(bodyParser());

// Подключение MongoDB к запросам
app.use(dbMiddleware);

// Подключение маршрутов
app.use(usersRouter.routes());
app.use(usersRouter.allowedMethods());

// Запуск сервера
async function startServer() {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log('[INFO] MongoDB подключена');
            console.log(`[INFO] Koa-сервер на порту ${PORT}`);
            console.log(`[INFO] Группа: ${GROUP_NAME}`);
        });
    } catch (error) {
        console.error('[ERROR] Не удалось запустить сервер:', error);
        process.exit(1);
    }
}

startServer();