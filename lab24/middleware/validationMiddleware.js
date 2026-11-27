function validationMiddleware(schema) {
    return async (ctx, next) => {
        const { error, value } = schema.validate(
            ctx.request.body || {},
            {
                abortEarly: false,
                stripUnknown: true
            }
        );

        if (error) {
            ctx.status = 400;

            ctx.body = {
                data: null,
                error: 'Validation failed',
                details: error.details.map(item => ({
                    field: item.path.join('.'),
                    message: item.message
                }))
            };

            return;
        }

        ctx.request.body = value;

        await next();
    };
}

module.exports = validationMiddleware;