
function validateStudent(data) {
    if (!data.name || data.name.trim().length < 2 ||
        data.name.trim().length > 100) {
        throw Object.assign(new Error('Имя должно содержать от 2 до 100 символов'), {
            status: 400
        });
    }

    if (!/^ББМО-\d{2}-\d{2}$/.test(data.group_name || '')) {
        throw Object.assign(new Error('Неверный формат группы'), {
            status: 400
        });
    }

    if (!Number.isInteger(Number(data.course)) ||
        Number(data.course) < 1 || Number(data.course) > 4) {
        throw Object.assign(new Error('Курс должен быть от 1 до 4'), {
            status: 400
        });
    }

    if (data.grade !== undefined && data.grade !== null &&
        (Number(data.grade) < 0 || Number(data.grade) > 5)) {
        throw Object.assign(new Error('Оценка должна быть от 0 до 5'), {
            status: 400
        });
    }
}

async function getAll(db, options = {}) {
    const limit = Math.min(Math.max(Number(options.limit) || 10, 1), 100);
    const offset = Math.max(Number(options.offset) || 0, 0);

    const [data] = await db.execute(
        'SELECT * FROM students ORDER BY id LIMIT ? OFFSET ?',
        [limit, offset]
    );

    const [[count]] = await db.query(
        'SELECT COUNT(*) AS total FROM students'
    );

    return {
        data,
        pagination: {
            total: count.total,
            limit,
            offset,
            pages: Math.ceil(count.total / limit)
        }
    };
}

async function getById(db, id) {
    const [rows] = await db.execute(
        'SELECT * FROM students WHERE id = ?',
        [id]
    );

    return rows[0] || null;
}

async function create(db, data) {
    validateStudent(data);

    const [result] = await db.execute(
        `INSERT INTO students
        (name, group_name, course, grade)
        VALUES (?, ?, ?, ?)`,
        [
            data.name.trim(),
            data.group_name,
            Number(data.course),
            data.grade === undefined ? null : data.grade
        ]
    );

    return getById(db, result.insertId);
}

async function update(db, id, data) {
    validateStudent(data);

    const [result] = await db.execute(
        `UPDATE students
         SET name = ?, group_name = ?, course = ?, grade = ?
         WHERE id = ?`,
        [
            data.name.trim(),
            data.group_name,
            Number(data.course),
            data.grade === undefined ? null : data.grade,
            id
        ]
    );

    if (!result.affectedRows) return null;
    return getById(db, id);
}

async function remove(db, id) {
    const [result] = await db.execute(
        'DELETE FROM students WHERE id = ?',
        [id]
    );

    return result.affectedRows > 0;
}

async function getStats(db) {
    const [[summary]] = await db.query(`
        SELECT
            COUNT(*) AS total,
            ROUND(AVG(grade), 2) AS averageGrade,
            MIN(grade) AS minGrade,
            MAX(grade) AS maxGrade
        FROM students
    `);

    const [byGroup] = await db.query(`
        SELECT group_name, COUNT(*) AS total
        FROM students
        GROUP BY group_name
    `);

    const [byCourse] = await db.query(`
        SELECT course, COUNT(*) AS total
        FROM students
        GROUP BY course
    `);

    return {
        total: summary.total,
        averageGrade: summary.averageGrade,
        minGrade: summary.minGrade,
        maxGrade: summary.maxGrade,
        byGroup,
        byCourse
    };
}

async function createBatch(db, students) {
    if (!Array.isArray(students) || students.length === 0 ||
        students.length > 100) {
        throw Object.assign(new Error('Передайте от 1 до 100 студентов'), {
            status: 400
        });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const created = [];

        for (const student of students) {
            validateStudent(student);

            const [result] = await connection.execute(
                `INSERT INTO students
                (name, group_name, course, grade)
                VALUES (?, ?, ?, ?)`,
                [
                    student.name.trim(),
                    student.group_name,
                    Number(student.course),
                    student.grade === undefined ? null : student.grade
                ]
            );

            created.push(result.insertId);
        }

        await connection.commit();

        return {
            created: created.length,
            ids: created,
            transaction: 'committed'
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove,
    getStats,
    createBatch
};
