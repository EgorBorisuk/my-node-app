
const cache = new Map();

const stats = {
    hits: 0,
    misses: 0
};

const TTL = 60 * 1000;

async function cacheMiddleware(ctx, next) {
    if (ctx.path === '/api/cache/stats') {
        await next();
        return;
    }

    if (ctx.method === 'GET') {
        const key = ctx.originalUrl;
        const saved = cache.get(key);

        if (saved && saved.expires > Date.now()) {
            stats.hits++;
            ctx.body = saved.body;
            ctx.status = saved.status;
            ctx.set('X-Cache', 'HIT');
            return;
        }

        stats.misses++;

        await next();

        if (ctx.status === 200 && ctx.body !== undefined) {
            cache.set(key, {
                body: ctx.body,
                status: ctx.status,
                expires: Date.now() + TTL
            });

            ctx.set('X-Cache', 'MISS');
        }

        return;
    }

    await next();

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(ctx.method)) {
        cache.clear();
    }
}

function getCacheStats() {
    const total = stats.hits + stats.misses;

    return {
        entries: cache.size,
        hits: stats.hits,
        misses: stats.misses,
        hitRate: total
            ? Number((stats.hits / total).toFixed(2))
            : 0,
        ttlSeconds: TTL / 1000
    };
}

module.exports = {
    cacheMiddleware,
    getCacheStats
};
