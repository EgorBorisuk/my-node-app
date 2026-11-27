
require('dotenv').config();

const { MongoClient, ReadPreference } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function main() {
    try {
        await client.connect();

        const db = client.db('bbmo_01_23');
        const students = db.collection('transaction_students');

        // Уникальный индекс для проверки дубликатов
        await students.createIndex(
            { student_id: 1 },
            { unique: true }
        );

        // Очистка тестовых данных
        await students.deleteMany({ lab_tag: 'lab23task4' });

        console.log('\n=== Реплика-сет ===');

        const hello = await db.admin().command({ hello: 1 });

        console.log('Replica Set:', hello.setName);
        console.log('Primary:', hello.primary);
        console.log('Вторичные:', hello.hosts?.length > 1
            ? hello.hosts.length - 1
            : 0
        );

        // =====================================
        // УСПЕШНАЯ ТРАНЗАКЦИЯ
        // =====================================

        console.log('\n=== Транзакция (успех) ===');

        const session1 = client.startSession();

        try {
            session1.startTransaction();

            console.log('[SESSION] Начало');
            console.log('[BEGIN] Транзакция начата');

            await students.insertOne({
                student_id: 1,
                name: 'Иван',
                group_name: 'ББМО-01-23',
                grade: 4.5,
                lab_tag: 'lab23task4'
            }, { session: session1 });

            console.log('[INSERT] Студент 1: Иван');

            await students.insertOne({
                student_id: 2,
                name: 'Мария',
                group_name: 'ББМО-01-23',
                grade: 3.8,
                lab_tag: 'lab23task4'
            }, { session: session1 });

            console.log('[INSERT] Студент 2: Мария');

            await students.updateOne(
                { student_id: 1 },
                { $set: { grade: 4.8 } },
                { session: session1 }
            );

            console.log('[UPDATE] Студент 1: grade=4.8');

            await session1.commitTransaction();

            console.log('[COMMIT] Транзакция зафиксирована');
            console.log('Данные сохранены');

        } catch (error) {
            await session1.abortTransaction();
            console.log('[ABORT]', error.message);
        } finally {
            await session1.endSession();
        }

        // =====================================
        // ТРАНЗАКЦИЯ С ОТКАТОМ
        // =====================================

        console.log('\n=== Транзакция (откат) ===');

        const session2 = client.startSession();

        try {
            session2.startTransaction();

            console.log('[BEGIN] Транзакция начата');

            await students.insertOne({
                student_id: 3,
                name: 'Петр',
                group_name: 'ББМО-01-23',
                grade: 4.0,
                lab_tag: 'lab23task4'
            }, { session: session2 });

            console.log('[INSERT] Студент 3: Петр');

            // Повторный student_id вызывает ошибку
            await students.insertOne({
                student_id: 3,
                name: 'Петр Дубликат',
                group_name: 'ББМО-01-23',
                grade: 3.5,
                lab_tag: 'lab23task4'
            }, { session: session2 });

            await session2.commitTransaction();

        } catch (error) {
            console.log('[ERROR] Дубликат:', error.code);
            await session2.abortTransaction();
            console.log('[ABORT] Транзакция отменена');
            console.log('Данные не сохранены');
        } finally {
            await session2.endSession();
        }

        // Проверка после отката
        const savedStudents = await students.find(
            { lab_tag: 'lab23task4' }
        ).toArray();

        console.log('\n=== Проверка после отката ===');
        console.log('Количество студентов:', savedStudents.length);

        savedStudents.forEach(student => {
            console.log(student.name, student.grade);
        });

        // =====================================
        // CHANGE STREAMS
        // =====================================

        console.log('\n=== Change Streams ===');

        const stream = students.watch(
            [],
            { fullDocument: 'updateLookup' }
        );

        console.log('[WATCH] Отслеживание изменений');

        const watching = (async () => {
            for await (const change of stream) {
                console.log(
                    '[CHANGE]',
                    change.operationType,
                    change.fullDocument || change.documentKey
                );
            }
        })();

        // Даём Change Stream время запуститься
        await new Promise(resolve => setTimeout(resolve, 1000));

        // INSERT
        const inserted = await students.insertOne({
            student_id: 4,
            name: 'Анна',
            group_name: 'ББМО-01-23',
            grade: 4.2,
            lab_tag: 'lab23task4'
        });

        // UPDATE
        await students.updateOne(
            { _id: inserted.insertedId },
            { $set: { grade: 5.0 } }
        );

        // DELETE
        await students.deleteOne({
            _id: inserted.insertedId
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        await stream.close();
        await watching;

        console.log('[WATCH] Stream закрыт');

        // =====================================
        // READ PREFERENCE
        // =====================================

        console.log('\n=== Read Preference ===');

        const preferences = [
            'primary',
            'primaryPreferred',
            'secondary',
            'secondaryPreferred',
            'nearest'
        ];

        for (const preference of preferences) {
            try {
                const result = await students
                    .find({ lab_tag: 'lab23task4' })
                    .withReadPreference(preference)
                    .toArray();

                console.log(
                    preference + ':',
                    result.length,
                    'документов'
                );
            } catch (error) {
                console.log(
                    preference + ':',
                    error.message
                );
            }
        }

    } catch (error) {
        console.error('\nОшибка:', error);
    } finally {
        await client.close();
        console.log('\nСоединение закрыто');
    }
}

main();
