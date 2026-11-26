
async function errorHandler(ctx, next) {
    try {
        await next();
    } catch (error) {
        console.error('[ERROR]', error.code || error.message);

        let status = 500;
        let message = 'Внутренняя ошибка сервера';

        if (error.code === 'ER_DUP_ENTRY') {
            status = 409;
            message = 'Такая запись уже существует';
        } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            status = 400;
            message = 'Связанная запись не найдена';
        } else if (error.code === 'ECONNREFUSED') {
            status = 503;
            message = 'База данных недоступна';
        } else if (error.status && error.status < 500) {
            status = error.status;
            message = error.message;
        }

        ctx.status = status;
        ctx.body = {
            success: false,
            error: {
                code: error.code || 'INTERNAL_ERROR',
                message
            }
        };
    }
}

module.exports = errorHandler;
