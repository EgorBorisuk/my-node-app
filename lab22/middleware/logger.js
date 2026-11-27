
const metrics = {
    queries: 0,
    totalTime: 0,
    errors: 0
};

function attachLogger(pool) {
    for (const method of ['query', 'execute']) {
        const original = pool[method].bind(pool);

        pool[method] = async (...args) => {
            const start = Date.now();
            metrics.queries++;

            try {
                const result = await original(...args);
                const duration = Date.now() - start;
                metrics.totalTime += duration;

                const sql = typeof args[0] === 'string'
                    ? args[0].replace(/\s+/g, ' ').trim()
                    : '[SQL]';

                console.log(
                    `[${new Date().toLocaleString()}] ` +
                    `[ББМО-01-23] ${sql} (${duration}ms)`
                );

                return result;
            } catch (error) {
                metrics.errors++;
                console.error('[SQL ERROR]', error.code, error.message);
                throw error;
            }
        };
    }
}

function getMetrics() {
    return {
        queries: metrics.queries,
        avgTime: metrics.queries
            ? Number((metrics.totalTime / metrics.queries).toFixed(2))
            : 0,
        errors: metrics.errors
    };
}

module.exports = { attachLogger, getMetrics };
