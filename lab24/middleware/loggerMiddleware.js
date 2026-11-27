async function loggerMiddleware(ctx, next) {
    const start = Date.now();

    await next();

    const duration = Date.now() - start;

    console.log(
        `[${new Date().toISOString()}] ` +
        `${ctx.method} ${ctx.url} ` +
        `${ctx.status} - ${duration}ms`
    );
}

module.exports = loggerMiddleware;