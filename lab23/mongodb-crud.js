
require('dotenv').config();

const { MongoClient, ObjectId } = require('mongodb');

const client = new MongoClient(process.env.MONGODB_URI);
const dbName = process.env.DB_NAME;

async function main() {
    try {
        await client.connect();

        const db = client.db(dbName);
        const students = db.collection('students');

        console.log('=== Коллекция students (группа ББМО-01-23) ===');

        // Индекс по группе
        await students.createIndex({ group_name: 1 });
        console.log('Индекс group_name создан');

        // Удаляем только тестовые записи этой лабораторной
        await students.deleteMany({ lab_tag: 'lab23' });

        // INSERT
        console.log('\n--- INSERT ---');

        const one = await students.insertOne({
            name: 'Егор Борисюк',
            group_name: 'ББМО-01-23',
            course: 4,
            grade: 4.8,
            created_at: new Date(),
            lab_tag: 'lab23'
        });

        console.log('✔ Вставлен документ:');
        console.log('insertedId:', one.insertedId);

        const many = await students.insertMany([
            {
                name: 'Иван Иванов',
                group_name: 'ББМО-01-23',
                course: 2,
                grade: 4.5,
                created_at: new Date(),
                lab_tag: 'lab23'
            },
            {
                name: 'Мария Петрова',
                group_name: 'ББМО-01-23',
                course: 2,
                grade: 3.8,
                created_at: new Date(),
                lab_tag: 'lab23'
            },
            {
                name: 'Алексей Смирнов',
                group_name: 'ББМО-01-23',
                course: 3,
                grade: 4.9,
                created_at: new Date(),
                lab_tag: 'lab23'
            },
            {
                name: 'Ольга Сидорова',
                group_name: 'ББМО-01-23',
                course: 1,
                grade: 2.5,
                created_at: new Date(),
                lab_tag: 'lab23'
            }
        ]);

        console.log('✔ Вставлено документов:', many.insertedCount);
        console.log('insertedIds:', many.insertedIds);

        // SELECT
        console.log('\n--- SELECT ---');

        const all = await students
            .find({ lab_tag: 'lab23' })
            .toArray();

        console.log('Все документы:', all.length);
        console.log(all);

        const filtered = await students
            .find({ group_name: 'ББМО-01-23', lab_tag: 'lab23' })
            .toArray();

        console.log('\nПоиск по группе:', filtered.length);
        console.log(filtered);

        const sorted = await students
            .find({ lab_tag: 'lab23' })
            .sort({ grade: -1 })
            .toArray();

        console.log('\nСортировка по оценке:');
        console.log(sorted);

        const paginated = await students
            .find({ lab_tag: 'lab23' })
            .sort({ grade: -1 })
            .limit(2)
            .skip(1)
            .toArray();

        console.log('\nПагинация (limit 2, skip 1):');
        console.log(paginated);

        const found = await students.findOne({
            _id: new ObjectId(one.insertedId)
        });

        console.log('\nПоиск одного документа:');
        console.log(found);

        // UPDATE
        console.log('\n--- UPDATE ---');

        const updateOne = await students.updateOne(
            { _id: one.insertedId },
            { $set: { grade: 5.0 } }
        );

        console.log(
            'updateOne: matchedCount =',
            updateOne.matchedCount,
            'modifiedCount =',
            updateOne.modifiedCount
        );

        const updateMany = await students.updateMany(
            { lab_tag: 'lab23', course: 2 },
            { $inc: { course: 1 } }
        );

        console.log(
            'updateMany: matchedCount =',
            updateMany.matchedCount,
            'modifiedCount =',
            updateMany.modifiedCount
        );

        // DELETE
        console.log('\n--- DELETE ---');

        const deleteOne = await students.deleteOne({
            name: 'Иван Иванов',
            lab_tag: 'lab23'
        });

        console.log('deleteOne: deletedCount =', deleteOne.deletedCount);

        const deleteMany = await students.deleteMany({
            lab_tag: 'lab23',
            grade: { $lt: 3 }
        });

        console.log('deleteMany: deletedCount =', deleteMany.deletedCount);

        // PROJECTION
        console.log('\n--- PROJECTION ---');

        const projection = await students.find(
            { lab_tag: 'lab23' },
            {
                projection: {
                    name: 1,
                    grade: 1,
                    _id: 0
                }
            }
        ).toArray();

        console.log('Только name и grade:');
        console.log(projection);

        console.log('\n✔ Задание 2 выполнено');

    } catch (error) {
        console.error('Ошибка:', error);
    } finally {
        await client.close();
    }
}

main();
