
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

class StudentDAO {
    constructor(pool) {
        this.pool = pool;
    }

    // Проверка данных студента
    validate(data) {
        const errors = [];

        if (data.name !== undefined) {
            if (typeof data.name !== 'string' ||
                data.name.trim().length < 2 ||
                data.name.trim().length > 100) {
                errors.push('name должно содержать от 2 до 100 символов');
            }
        }

        if (data.group_name !== undefined) {
            if (typeof data.group_name !== 'string' ||
                !/^ББМО-\d{2}-\d{2}$/.test(data.group_name)) {
                errors.push('group_name не соответствует формату ББМО-XX-XX');
            }
        }

        if (data.course !== undefined) {
            if (!Number.isInteger(data.course) ||
                data.course < 1 || data.course > 4) {
                errors.push('course должен быть целым числом от 1 до 4');
            }
        }

        if (data.grade !== undefined && data.grade !== null) {
            if (typeof data.grade !== 'number' ||
                data.grade < 0 || data.grade > 5) {
                errors.push('grade должен быть от 0 до 5 или NULL');
            }
        }

        if (errors.length > 0) {
            throw new Error(errors.join('; '));
        }
    }

    // Создание студента
    async create(data) {
        this.validate(data);

        if (!data.name || !data.group_name ||
            data.course === undefined) {
            throw new Error('Необходимо заполнить name, group_name и course');
        }

        const [result] = await this.pool.execute(
            `INSERT INTO students (name, group_name, course, grade)
             VALUES (?, ?, ?, ?)`,
            [
                data.name.trim(),
                data.group_name,
                data.course,
                data.grade ?? null
            ]
        );

        return this.findById(result.insertId);
    }

    // Получение студента по ID
    async findById(id) {
        const [rows] = await this.pool.execute(
            'SELECT * FROM students WHERE id = ?',
            [id]
        );

        return rows[0] || null;
    }

    // Получение списка с пагинацией, фильтрами и сортировкой
    async findAll(options = {}) {
        const limit = Math.min(
            Math.max(Number(options.limit) || 10, 1), 100
        );

        const offset = Math.max(Number(options.offset) || 0, 0);

        const conditions = [];
        const params = [];

        if (options.group_name) {
            conditions.push('group_name = ?');
            params.push(options.group_name);
        }

        if (options.course !== undefined) {
            conditions.push('course = ?');
            params.push(options.course);
        }

        if (options.grade_min !== undefined) {
            conditions.push('grade >= ?');
            params.push(options.grade_min);
        }

        if (options.grade_max !== undefined) {
            conditions.push('grade <= ?');
            params.push(options.grade_max);
        }

        const where = conditions.length
            ? 'WHERE ' + conditions.join(' AND ')
            : '';

        // Разрешённые варианты сортировки
        const sortOptions = {
            name_asc: 'name ASC',
            name_desc: 'name DESC',
            grade_asc: 'grade ASC',
            grade_desc: 'grade DESC',
            date_asc: 'created_at ASC',
            date_desc: 'created_at DESC'
        };

        const sort = sortOptions[options.sort] || 'id ASC';

        const [countRows] = await this.pool.execute(
            `SELECT COUNT(*) AS total FROM students ${where}`,
            params
        );

        const total = countRows[0].total;

        const [rows] = await this.pool.execute(
            `SELECT * FROM students
             ${where}
             ORDER BY ${sort}
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        const page = Math.floor(offset / limit) + 1;

        return {
            data: rows,
            total: total,
            page: page,
            totalPages: Math.ceil(total / limit),
            limit: limit,
            offset: offset
        };
    }

    // Обновление данных студента
    async update(id, data) {
        this.validate(data);

        const allowedFields = [
            'name',
            'group_name',
            'course',
            'grade'
        ];

        const fields = Object.keys(data)
            .filter(key => allowedFields.includes(key));

        if (fields.length === 0) {
            throw new Error('Нет данных для обновления');
        }

        const values = fields.map(key =>
            key === 'name' ? data[key].trim() : data[key]
        );

        const setClause = fields
            .map(field => `${field} = ?`)
            .join(', ');

        const [result] = await this.pool.execute(
            `UPDATE students SET ${setClause} WHERE id = ?`,
            [...values, id]
        );

        return {
            affectedRows: result.affectedRows,
            changedRows: result.changedRows,
            student: await this.findById(id)
        };
    }

    // Удаление студента
    async delete(id) {
        const [result] = await this.pool.execute(
            'DELETE FROM students WHERE id = ?',
            [id]
        );

        return result.affectedRows > 0;
    }

    // Поиск по имени
    async search(query) {
        const [rows] = await this.pool.execute(
            'SELECT * FROM students WHERE name LIKE ? ORDER BY name ASC',
            [`%${query}%`]
        );

        return rows;
    }

    // Получение статистики
    async getStats() {
        const [general] = await this.pool.query(`
            SELECT
                COUNT(*) AS total,
                ROUND(AVG(grade), 2) AS average_grade,
                MIN(grade) AS min_grade,
                MAX(grade) AS max_grade
            FROM students
        `);

        const [groups] = await this.pool.query(`
            SELECT group_name, COUNT(*) AS total
            FROM students
            GROUP BY group_name
            ORDER BY group_name
        `);

        const [courses] = await this.pool.query(`
            SELECT course, COUNT(*) AS total
            FROM students
            GROUP BY course
            ORDER BY course
        `);

        return {
            general: general[0],
            groups: groups,
            courses: courses
        };
    }
}

// Демонстрация работы StudentDAO
async function main() {
    const dao = new StudentDAO(pool);

    try {
        console.log('=== StudentDAO (группа ББМО-01-23) ===');

        // Создание с проверкой данных
        console.log('\n--- Создание с валидацией ---');

        const student = await dao.create({
            name: 'Иван Иванов',
            group_name: 'ББМО-01-23',
            course: 2,
            grade: 4.5
        });

        console.log(`✔ Создан: id=${student.id}, name=${student.name}`);

        try {
            await dao.create({
                name: 'А',
                group_name: 'ББМО-01-23',
                course: 2,
                grade: 4.5
            });
        } catch (error) {
            console.log('✖ Ошибка:', error.message);
        }

        try {
            await dao.create({
                name: 'Проверка',
                group_name: 'НЕВЕРНАЯ-ГРУППА',
                course: 2,
                grade: 4.5
            });
        } catch (error) {
            console.log('✖ Ошибка:', error.message);
        }

        // Поиск по ID
        console.log('\n--- Поиск по ID ---');
        console.log(await dao.findById(student.id));

        // Пагинация
        console.log('\n--- Пагинация ---');

        const page = await dao.findAll({
            limit: 5,
            offset: 0,
            sort: 'name_asc'
        });

        console.log(`Всего: ${page.total}`);
        console.log(`Страница: ${page.page}/${page.totalPages}`);

        page.data.forEach(item => {
            console.log(
                `id=${item.id}, name=${item.name}, ` +
                `group=${item.group_name}, grade=${item.grade}`
            );
        });

        // Фильтры
        console.log('\n--- Фильтры ---');

        const byGroup = await dao.findAll({
            group_name: 'ББМО-01-23',
            course: 2
        });

        console.log(
            `По группе и курсу найдено: ${byGroup.total}`
        );

        const byGrade = await dao.findAll({
            grade_min: 4.0,
            grade_max: 5.0,
            sort: 'grade_desc'
        });

        console.log(
            `По диапазону оценок найдено: ${byGrade.total}`
        );

        // Обновление
        console.log('\n--- Обновление ---');

        const updated = await dao.update(student.id, {
            grade: 4.9
        });

        console.log(
            `Изменено записей: ${updated.affectedRows}`
        );

        // Поиск по имени
        console.log('\n--- Поиск ---');

        const found = await dao.search('Иван');

        console.log(`Найдено: ${found.length} студентов`);

        found.forEach(item => {
            console.log(`id=${item.id}, name=${item.name}`);
        });

        // Статистика
        console.log('\n--- Статистика ---');

        const stats = await dao.getStats();

        console.log('Всего студентов:', stats.general.total);
        console.log('Средний балл:', stats.general.average_grade);
        console.log('Минимальная оценка:', stats.general.min_grade);
        console.log('Максимальная оценка:', stats.general.max_grade);

        console.log('\nПо группам:');

        stats.groups.forEach(item => {
            console.log(`${item.group_name}: ${item.total}`);
        });

        console.log('\nПо курсам:');

        stats.courses.forEach(item => {
            console.log(`${item.course} курс: ${item.total}`);
        });

        // Удаление тестовой записи
        console.log('\n--- Удаление тестовой записи ---');

        const deleted = await dao.delete(student.id);

        console.log(
            deleted
                ? '✔ Тестовая запись удалена'
                : '✖ Запись не найдена'
        );

    } catch (error) {
        console.error('[DAO ERROR]', error.message);
    } finally {
        await pool.end();
        console.log('\nПул соединений закрыт');
    }
}

main();
