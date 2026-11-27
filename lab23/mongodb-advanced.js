
require('dotenv').config();

const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGODB_URI);
const dbName = process.env.DB_NAME;

const TOTAL_DOCUMENTS = 1000000;
const BATCH_SIZE = 10000;

async function main() {
    try {
        await client.connect();

        const db = client.db(dbName);
        const students = db.collection('advanced_students');
        const groups = db.collection('advanced_groups');

        console.log('=== Задание 3: Курсоры, агрегации и большие данные ===');

        // Подготовка тестовых данных
        await students.deleteMany({ lab_tag: 'lab23advanced' });
        await groups.deleteMany({ lab_tag: 'lab23advanced' });

        await groups.insertMany([
            {
                group_name: 'ББМО-01-23',
                curator: 'Иванов И.И.',
                lab_tag: 'lab23advanced'
            },
            {
                group_name: 'ББМО-02-23',
                curator: 'Петров П.П.',
                lab_tag: 'lab23advanced'
            },
            {
                group_name: 'ББМО-03-23',
                curator: 'Сидоров С.С.',
                lab_tag: 'lab23advanced'
            }
        ]);

        // Генерация 1 000 000 документов
        console.log('\n=== Генерация данных ===');

        for (let start = 0; start < TOTAL_DOCUMENTS; start += BATCH_SIZE) {
            const batch = [];

            for (
                let i = start;
                i < Math.min(start + BATCH_SIZE, TOTAL_DOCUMENTS);
                i++
            ) {
                const groupNumber = (i % 3) + 1;

                batch.push({
                    name: ['Иван Иванов', 'Мария Петрова', 'Петр Сидоров'][i % 3],
                    group_name: `ББМО-0${groupNumber}-23`,
                    course: (i % 4) + 1,
                    grade: Number((3 + (i % 21) / 10).toFixed(1)),
                    email: `student${i}@example.com`,
                    lab_tag: 'lab23advanced',
                    created_at: new Date()
                });
            }

            await students.insertMany(batch);

            console.log(
                `Добавлено: ${Math.min(start + BATCH_SIZE, TOTAL_DOCUMENTS)} / ${TOTAL_DOCUMENTS}`
            );
        }

        // КУРСОРЫ
        console.log('\n=== Курсоры ===');

        const cursor = students.find({
            lab_tag: 'lab23advanced'
        }).batchSize(1000);

        let count = 0;
        const startStream = Date.now();

        for await (const doc of cursor) {
            count++;

            if (count <= 3) {
                console.log('Документ:', doc.name, doc.grade);
            }
        }

        console.log('Получено документов:', count);
        console.log('Время потокового чтения:', Date.now() - startStream, 'мс');

        await cursor.close();

        // Сравнение с toArray на ограниченной выборке
        console.log('\nСравнение с toArray()');

        const memoryBefore = process.memoryUsage().heapUsed;

        const arrayData = await students.find({
            lab_tag: 'lab23advanced'
        }).limit(10000).toArray();

        const memoryAfter = process.memoryUsage().heapUsed;

        console.log('Загружено через toArray():', arrayData.length);
        console.log(
            'Использовано памяти:',
            ((memoryAfter - memoryBefore) / 1024 / 1024).toFixed(2),
            'МБ'
        );

        // АГРЕГАЦИИ
        console.log('\n=== Агрегации ===');

        const averageByGroup = await students.aggregate([
            { $match: { lab_tag: 'lab23advanced' } },
            {
                $group: {
                    _id: '$group_name',
                    averageGrade: { $avg: '$grade' },
                    total: { $sum: 1 }
                }
            },
            { $sort: { averageGrade: -1 } },
            {
                $project: {
                    _id: 0,
                    group: '$_id',
                    averageGrade: 1,
                    total: 1
                }
            }
        ]).toArray();

        console.log('Средний балл по группам:');
        console.log(averageByGroup);

        const byCourse = await students.aggregate([
            { $match: { lab_tag: 'lab23advanced' } },
            {
                $group: {
                    _id: '$course',
                    total: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]).toArray();

        console.log('\nКоличество студентов по курсам:');
        console.log(byCourse);

        const topStudents = await students.aggregate([
            { $match: { lab_tag: 'lab23advanced' } },
            { $sort: { grade: -1 } },
            { $limit: 10 },
            {
                $project: {
                    _id: 0,
                    name: 1,
                    group_name: 1,
                    grade: 1
                }
            }
        ]).toArray();

        console.log('\nТоп-10 студентов:');
        console.log(topStudents);

        // $lookup
        const lookupResult = await students.aggregate([
            {
                $match: {
                    lab_tag: 'lab23advanced',
                    group_name: 'ББМО-01-23'
                }
            },
            {
                $group: {
                    _id: '$group_name',
                    total: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'advanced_groups',
                    localField: '_id',
                    foreignField: 'group_name',
                    as: 'groupInfo'
                }
            },
            { $unwind: '$groupInfo' },
            {
                $project: {
                    _id: 0,
                    group_name: '$_id',
                    students: '$total',
                    curator: '$groupInfo.curator'
                }
            }
        ]).toArray();

        console.log('\n$lookup (связь с groups):');
        console.log(lookupResult);

        // ИНДЕКСЫ И EXPLAIN
        console.log('\n=== Индексы ===');

        const withoutIndex = await students.find({
            lab_tag: 'lab23advanced',
            group_name: 'ББМО-01-23'
        }).hint({ $natural: 1 }).explain('executionStats');

        console.log('\nExplain без индекса:');
        console.log(
            'executionTimeMillis:',
            withoutIndex.executionStats.executionTimeMillis
        );
        console.log(
            'totalDocsExamined:',
            withoutIndex.executionStats.totalDocsExamined
        );

        await students.createIndex({ group_name: 1 });
        console.log('Создан индекс group_name_1');

        await students.createIndex({ group_name: 1, grade: -1 });
        console.log('Создан составной индекс group_name_1_grade_-1');

        await students.createIndex({ email: 1 }, { unique: true });
        console.log('Создан уникальный индекс email_1');

        const withIndex = await students.find({
            lab_tag: 'lab23advanced',
            group_name: 'ББМО-01-23'
        }).hint({ group_name: 1 }).explain('executionStats');

        console.log('\nExplain с индексом:');
        console.log(
            'executionTimeMillis:',
            withIndex.executionStats.executionTimeMillis
        );
        console.log(
            'totalDocsExamined:',
            withIndex.executionStats.totalDocsExamined
        );

        // ТЕКСТОВЫЙ ПОИСК
        console.log('\n=== Текстовый поиск ===');

        await students.createIndex({ name: 'text' });
        console.log('Создан текстовый индекс name_text');

        const searchResult = await students.find(
            {
                $text: { $search: 'Иван' },
                lab_tag: 'lab23advanced'
            },
            {
                projection: {
                    name: 1,
                    score: { $meta: 'textScore' }
                }
            }
        )
        .sort({ score: { $meta: 'textScore' } })
        .limit(10)
        .toArray();

        console.log('Результаты поиска по слову Иван:');
        console.log(searchResult);

        console.log('\n✔ Задание 3 выполнено');

    } catch (error) {
        console.error('\nОшибка:', error);
    } finally {
        await client.close();
    }
}

main();
