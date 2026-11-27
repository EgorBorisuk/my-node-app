const Joi = require('joi');
const UserService = require('../services/userService');

const userSchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    group_name: Joi.string()
        .pattern(/^ББМО-\d{2}-\d{2}$/)
        .required(),
    age: Joi.number().integer().min(16).max(100).required(),
    course: Joi.number().integer().min(1).max(4).optional()
});

exports.schema = userSchema;

// Проверка параметров списка
const querySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    group_name: Joi.string().optional(),
    course: Joi.number().integer().min(1).max(4).optional(),
    age_min: Joi.number().integer().min(16).max(100).optional(),
    age_max: Joi.number().integer().min(16).max(100).optional(),
    sort: Joi.string().valid(
        'name', '-name',
        'age', '-age',
        'created_at', '-created_at'
    ).default('name')
});

// GET /api/users
exports.getAll = async (ctx) => {
    const { error, value } = querySchema.validate(ctx.query);

    if (error) {
        ctx.throw(400, 'Invalid query parameters');
    }

    if (value.age_min && value.age_max &&
        value.age_min > value.age_max) {
        ctx.throw(400, 'age_min cannot exceed age_max');
    }

    const result = await UserService.getAllUsers(value);

    ctx.body = {
        ...result,
        error: null
    };
};

// GET /api/users/:id
exports.getById = async (ctx) => {
    const user = await UserService.getUserById(ctx.params.id);

    ctx.body = {
        data: user,
        error: null
    };
};

// POST /api/users
exports.create = async (ctx) => {
    const user = await UserService.createUser(ctx.request.body);

    ctx.status = 201;
    ctx.body = {
        data: user,
        error: null
    };
};

// PUT /api/users/:id
exports.update = async (ctx) => {
    const user = await UserService.updateUser(
        ctx.params.id,
        ctx.request.body
    );

    ctx.body = {
        data: user,
        error: null
    };
};

// DELETE /api/users/:id
exports.remove = async (ctx) => {
    const result = await UserService.deleteUser(ctx.params.id);

    ctx.body = {
        data: result,
        error: null
    };
};

// GET /api/users/search?q=...
exports.search = async (ctx) => {
    const query = ctx.query.q;

    if (!query || query.trim().length < 2) {
        ctx.throw(400, 'Search query must contain at least 2 characters');
    }

    const users = await UserService.searchUsers(query.trim());

    ctx.body = {
        data: users,
        total: users.length,
        error: null
    };
};

// GET /api/users/stats
exports.stats = async (ctx) => {
    const stats = await UserService.getStatistics();

    ctx.body = {
        data: stats,
        error: null
    };
};

// GET /api/users/export
exports.export = async (ctx) => {
    const users = await UserService.exportUsers();

    const columns = [
        '_id',
        'name',
        'email',
        'group_name',
        'age',
        'course'
    ];

    const escapeCSV = (value) => {
        const text = value === undefined || value === null
            ? ''
            : String(value);

        return '"' + text.replace(/"/g, '""') + '"';
    };

    const csv = [
        columns.join(';'),
        ...users.map(user =>
            columns.map(column => escapeCSV(user[column])).join(';')
        )
    ].join('\r\n');

    ctx.set('Content-Type', 'text/csv; charset=utf-8');
    ctx.set('Content-Disposition', 'attachment; filename="users.csv"');

    ctx.body = '\uFEFF' + csv;
};