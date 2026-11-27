const { ObjectId } = require('mongodb');
const { getDB } = require('../db');

class User {
    static collection() {
        return getDB().collection('users');
    }

    // Получение пользователей с фильтрацией и пагинацией
    static async findAll(options = {}) {
        const {
            page = 1,
            limit = 10,
            group_name,
            course,
            age_min,
            age_max,
            sort = 'name'
        } = options;

        const filter = {};

        if (group_name) {
            filter.group_name = group_name;
        }

        if (course) {
            filter.course = Number(course);
        }

        if (age_min || age_max) {
            filter.age = {};

            if (age_min) filter.age.$gte = Number(age_min);
            if (age_max) filter.age.$lte = Number(age_max);
        }

        const allowedSort = [
            'name', '-name',
            'age', '-age',
            'created_at', '-created_at'
        ];

        const sortField = allowedSort.includes(sort) ? sort : 'name';
        const direction = sortField.startsWith('-') ? -1 : 1;
        const field = sortField.replace('-', '');

        const total = await this.collection().countDocuments(filter);

        const users = await this.collection()
            .find(filter, {
                projection: { password: 0 }
            })
            .sort({ [field]: direction })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
            .toArray();

        return {
            data: users,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit))
            }
        };
    }

    static async findById(id) {
        if (!ObjectId.isValid(id)) return null;

        return this.collection().findOne(
            { _id: new ObjectId(id) },
            { projection: { password: 0 } }
        );
    }

    static async findByEmail(email) {
        return this.collection().findOne({
            email: email.toLowerCase().trim()
        });
    }

    static async create(data) {
        const user = {
            name: data.name.trim(),
            email: data.email.toLowerCase().trim(),
            group_name: data.group_name,
            age: Number(data.age),
            course: data.course ? Number(data.course) : undefined,
            created_at: new Date()
        };

        const result = await this.collection().insertOne(user);

        return {
            ...user,
            _id: result.insertedId
        };
    }

    static async update(id, data) {
        if (!ObjectId.isValid(id)) return null;

        const updateData = {
            name: data.name.trim(),
            email: data.email.toLowerCase().trim(),
            group_name: data.group_name,
            age: Number(data.age),
            updated_at: new Date()
        };

        if (data.course !== undefined) {
            updateData.course = Number(data.course);
        }

        return this.collection().findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: updateData },
            {
                returnDocument: 'after',
                projection: { password: 0 }
            }
        );
    }

    static async delete(id) {
        if (!ObjectId.isValid(id)) return false;

        const result = await this.collection().deleteOne({
            _id: new ObjectId(id)
        });

        return result.deletedCount > 0;
    }

    // Поиск по имени и email
    static async search(query) {
        return this.collection().find(
            {
                $or: [
                    { name: { $regex: query, $options: 'i' } },
                    { email: { $regex: query, $options: 'i' } }
                ]
            },
            {
                projection: { password: 0 }
            }
        ).toArray();
    }

    // Статистика пользователей
    static async getStats() {
        const total = await this.collection().countDocuments();

        const average = await this.collection().aggregate([
            {
                $group: {
                    _id: null,
                    averageAge: { $avg: '$age' }
                }
            }
        ]).toArray();

        const groups = await this.collection().aggregate([
            {
                $group: {
                    _id: '$group_name',
                    count: { $sum: 1 }
                }
            }
        ]).toArray();

        const courses = await this.collection().aggregate([
            {
                $group: {
                    _id: '$course',
                    count: { $sum: 1 }
                }
            }
        ]).toArray();

        return {
            total,
            averageAge: average.length
                ? Number(average[0].averageAge.toFixed(2))
                : 0,
            groups,
            courses
        };
    }

    // Экспорт пользователей
    static async exportAll() {
        return this.collection().find(
            {},
            {
                projection: { password: 0 }
            }
        ).toArray();
    }
}

module.exports = User;