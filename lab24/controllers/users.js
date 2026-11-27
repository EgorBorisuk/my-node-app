const User = require('../models/user');

// Проверка данных пользователя
function validateUser(data) {
    const errors = [];

    if (
        typeof data.name !== 'string' ||
        data.name.trim().length === 0
    ) {
        errors.push({
            field: 'name',
            message: 'Имя обязательно и должно быть строкой'
        });
    }

    if (
        typeof data.email !== 'string' ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)
    ) {
        errors.push({
            field: 'email',
            message: 'Неверный формат электронной почты'
        });
    }

    if (
        typeof data.group_name !== 'string' ||
        !/^ББМО-\d{2}-\d{2}$/.test(data.group_name)
    ) {
        errors.push({
            field: 'group_name',
            message: 'Формат группы должен быть ББМО-XX-XX'
        });
    }

    if (
        !Number.isInteger(Number(data.age)) ||
        Number(data.age) < 16 ||
        Number(data.age) > 100
    ) {
        errors.push({
            field: 'age',
            message: 'Возраст должен быть целым числом от 16 до 100'
        });
    }

    return errors;
}

// GET /api/users
exports.getAll = async (ctx) => {
    const users = await User.findAll();

    ctx.body = {
        data: users
    };
};

// GET /api/users/:id
exports.getById = async (ctx) => {
    const user = await User.findById(ctx.params.id);

    if (!user) {
        ctx.throw(404, 'User not found');
    }

    ctx.body = {
        data: user
    };
};

// POST /api/users
exports.create = async (ctx) => {
    const data = ctx.request.body || {};
    const errors = validateUser(data);

    if (errors.length > 0) {
        ctx.status = 400;
        ctx.body = {
            error: 'Validation failed',
            details: errors
        };
        return;
    }

    const existingUser = await User.findByEmail(data.email);

    if (existingUser) {
        ctx.throw(409, 'Email already exists');
    }

    const user = await User.create(data);

    ctx.status = 201;
    ctx.body = {
        data: user
    };
};

// PUT /api/users/:id
exports.update = async (ctx) => {
    const data = ctx.request.body || {};
    const errors = validateUser(data);

    if (errors.length > 0) {
        ctx.status = 400;
        ctx.body = {
            error: 'Validation failed',
            details: errors
        };
        return;
    }

    const existingUser = await User.findByEmail(data.email);

    if (
        existingUser &&
        existingUser._id.toString() !== ctx.params.id
    ) {
        ctx.throw(409, 'Email already exists');
    }

    const user = await User.update(ctx.params.id, data);

    if (!user) {
        ctx.throw(404, 'User not found');
    }

    ctx.body = {
        data: user
    };
};

// DELETE /api/users/:id
exports.remove = async (ctx) => {
    const deleted = await User.delete(ctx.params.id);

    if (!deleted) {
        ctx.throw(404, 'User not found');
    }

    ctx.body = {
        data: {
            message: 'User deleted successfully'
        }
    };
};