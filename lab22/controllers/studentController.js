
const service = require('../services/studentService');

async function getAll(ctx) {
    ctx.body = await service.getAll(ctx.db, ctx.query);
}

async function getById(ctx) {
    const student = await service.getById(ctx.db, ctx.params.id);

    if (!student) {
        ctx.throw(404, 'Студент не найден');
    }

    ctx.body = student;
}

async function create(ctx) {
    const student = await service.create(ctx.db, ctx.request.body);
    ctx.status = 201;
    ctx.body = {
        success: true,
        data: student
    };
}

async function update(ctx) {
    const student = await service.update(
        ctx.db,
        ctx.params.id,
        ctx.request.body
    );

    if (!student) ctx.throw(404, 'Студент не найден');

    ctx.body = {
        success: true,
        data: student
    };
}

async function remove(ctx) {
    const deleted = await service.remove(ctx.db, ctx.params.id);

    if (!deleted) ctx.throw(404, 'Студент не найден');

    ctx.body = {
        success: true,
        message: 'Студент удалён'
    };
}

async function stats(ctx) {
    ctx.body = await service.getStats(ctx.db);
}

async function batch(ctx) {
    ctx.body = await service.createBatch(ctx.db, ctx.request.body);
    ctx.status = 201;
}

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove,
    stats,
    batch
};
