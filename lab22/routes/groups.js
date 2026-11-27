
const Router = require('@koa/router');

const router = new Router({
    prefix: '/api/groups'
});

router.get('/', async (ctx) => {
    const [groups] = await ctx.db.query(
        'SELECT * FROM `groups` ORDER BY name'
    );

    ctx.body = groups;
});

router.post('/', async (ctx) => {
    const { name } = ctx.request.body;

    if (!/^ББМО-\d{2}-\d{2}$/.test(name || '')) {
        ctx.throw(400, 'Неверный формат названия группы');
    }

    const [result] = await ctx.db.execute(
        'INSERT INTO `groups` (name) VALUES (?)',
        [name]
    );

    ctx.status = 201;
    ctx.body = {
        success: true,
        id: result.insertId,
        name
    };
});

router.get('/:id/students', async (ctx) => {
    const [groups] = await ctx.db.execute(
        'SELECT * FROM `groups` WHERE id = ?',
        [ctx.params.id]
    );

    if (!groups.length) ctx.throw(404, 'Группа не найдена');

    const [students] = await ctx.db.execute(
        'SELECT * FROM students WHERE group_name = ? ORDER BY name',
        [groups[0].name]
    );

    ctx.body = {
        group: groups[0],
        students
    };
});

module.exports = router;
