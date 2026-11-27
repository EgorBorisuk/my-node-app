async function errorMiddleware(ctx, next) {
    try {
        await next();
    } catch (error) {
        ctx.status = error.status || 500;

        ctx.body = {
            data: null,
            error: error.status
                ? error.message
                : 'Internal server error',
            status: ctx.status
        };

        if (ctx.status === 500) {
            console.error('[ERROR]', error);
        }
    }
}

module.exports = errorMiddleware;