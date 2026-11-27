
const fs = require('fs');
const path = require('path');
const {
    Readable,
    Transform,
    Writable
} = require('stream');
const { pipeline } = require('stream/promises');

const GROUP = 'ББМО-01-23';
const TOTAL = 10000;
const BATCH_SIZE = 100;
const OUTPUT = path.join(__dirname, 'students.csv');
const ERROR_LOG = path.join(__dirname, 'errors.log');

const stats = {
    generated: 0,
    validated: 0,
    enriched: 0,
    filtered: 0,
    written: 0,
    errors: 0
};

function logError(message) {
    fs.appendFileSync(
        ERROR_LOG,
        `[${new Date().toLocaleString('ru-RU')}] [${GROUP}] ${message}\n`
    );
}


function createStudents() {
    let id = 1;
    let pending = [];
    let position = 0;

    return new Readable({
        objectMode: true,
        highWaterMark: 100,

        read() {
            if (position >= pending.length && id <= TOTAL) {
                pending = [];

                for (
                    let i = 0;
                    i < BATCH_SIZE && id <= TOTAL;
                    i++, id++
                ) {
                    const student = {
                        id,
                        name: `Студент ${id}`,
                        group: GROUP,
                        course: (id % 4) + 1,
                        grade: Number((2 + (id % 9) * 0.5).toFixed(1))
                    };

                    if (id === 123) student.name = '';
                    if (id === 456) student.grade = 10;
                    if (id === 789) student.group = '';
                    if (id === 1000) student.course = 0;
                    if (id === 1500) student.name = '';
                    if (id === 2000) student.grade = -1;
                    if (id === 2500) student.group = '';
                    if (id === 3000) student.course = 8;
                    if (id === 4000) student.name = '';
                    if (id === 5000) student.grade = 10;
                    if (id === 6000) student.group = '';
                    if (id === 7000) student.course = 0;
                    if (id === 8000) student.name = '';

                    pending.push(student);
                    stats.generated++;
                }

                position = 0;
            }

            while (position < pending.length) {
                const canContinue = this.push(pending[position]);
                position++;

                if (!canContinue) return;
            }

            if (id > TOTAL && position >= pending.length) {
                this.push(null);
            }
        }
    });
}






class ValidateTransform extends Transform {
    constructor() {
        super({
            objectMode: true,
            highWaterMark: 16
        });
    }

    _transform(student, encoding, callback) {
        const valid =
            student.name &&
            student.group === GROUP &&
            student.course >= 1 &&
            student.course <= 4 &&
            student.grade >= 2 &&
            student.grade <= 5;

        if (!valid) {
            stats.errors++;
            logError(
                `Ошибка валидации: id=${student.id}, некорректные данные`
            );
            stats.filtered++;
            return callback();
        }

        stats.validated++;
        callback(null, student);
    }
}

class EnrichTransform extends Transform {
    constructor() {
        super({
            objectMode: true,
            highWaterMark: 16
        });
    }

    _transform(student, encoding, callback) {
        student.averageGrade = Number(
            ((student.grade + 4) / 2).toFixed(1)
        );

        stats.enriched++;
        callback(null, student);
    }
}

class FilterTransform extends Transform {
    constructor() {
        super({
            objectMode: true,
            highWaterMark: 16
        });
    }

    _transform(student, encoding, callback) {
        if (student.grade > 3) {
            callback(null, student);
        } else {
            stats.filtered++;
            callback();
        }
    }
}

class FormatTransform extends Transform {
    constructor() {
        super({
            writableObjectMode: true,
            readableObjectMode: false,
            highWaterMark: 16
        });
    }

    _transform(student, encoding, callback) {
        const csvLine = [
            student.id,
            student.name,
            student.group,
            student.course,
            student.grade,
            student.averageGrade
        ].join(',') + '\n';

        callback(null, csvLine);
    }
}

class ProgressWritable extends Writable {
    constructor() {
        super({
            highWaterMark: 16
        });

        this.lastProgress = 0;
        this.backpressureShown = false;
    }

    write(chunk, encoding, callback) {
        const result = super.write(chunk, encoding, callback);

        if (!result && !this.backpressureShown) {
            this.backpressureShown = true;
            console.log(
                '[BACKPRESSURE] Буфер заполнен, запись приостановлена'
            );

            this.once('drain', () => {
                console.log('[DRAIN] Буфер освобождён, продолжаем запись');
            });
        }

        return result;
    }

    _write(chunk, encoding, callback) {
        fs.appendFile(OUTPUT, chunk, (error) => {
            if (error) return callback(error);

            stats.written++;

            const percent = Math.floor(
                stats.generated / TOTAL * 100
            );

            if (
                percent >= this.lastProgress + 20 ||
                stats.generated === TOTAL
            ) {
                this.lastProgress = percent;

                const filled = Math.floor(percent / 5);
                const bar =
                    '█'.repeat(filled) +
                    '░'.repeat(20 - filled);

                const elapsed = (Date.now() - startTime) / 1000;
                const speed = Math.round(
                    stats.generated / Math.max(elapsed, 0.001)
                );

                console.log(
                    `[PROGRESS] ${bar} ${percent}% | ` +
                    `${stats.generated}/${TOTAL} | ${speed} записей/сек`
                );
            }

            // Небольшая задержка для демонстрации backpressure
            setTimeout(callback, 1);
        });
    }
}

function showResults(startTime) {
    const elapsed = (Date.now() - startTime) / 1000;
    const speed = Math.round(stats.generated / Math.max(elapsed, 0.001));

    console.log('\n=== Результаты ===');
    console.log(`Всего сгенерировано: ${stats.generated}`);
    console.log(`Прошло валидацию: ${stats.validated}`);
    console.log(`Обогащено: ${stats.enriched}`);
    console.log(`Отфильтровано: ${stats.filtered}`);
    console.log(`Записано в CSV: ${stats.written}`);
    console.log(`Ошибок: ${stats.errors}`);
    console.log(`Время выполнения: ${elapsed.toFixed(2)} сек`);
    console.log(`Средняя скорость: ${speed} записей/сек`);
    console.log(`Файл: students.csv`);
}

async function demonstrateTimeout() {
    console.log('\n=== Отмена по таймауту ===');
    console.log('Запуск с таймаутом 1 сек...');

    const controller = new AbortController();

    const slowSource = new Readable({
        objectMode: true,

        read() {
            setTimeout(() => {
                this.push({ value: 'Данные' });
            }, 100);
        }
    });

    const slowTransform = new Transform({
        objectMode: true,

        transform(data, encoding, callback) {
            setTimeout(() => callback(null, data), 100);
        }
    });

    const destination = new Writable({
        objectMode: true,

        write(data, encoding, callback) {
            setTimeout(callback, 100);
        }
    });

    const timer = setTimeout(() => {
        controller.abort();
    }, 1000);

    try {
        await pipeline(
            slowSource,
            slowTransform,
            destination,
            { signal: controller.signal }
        );

        console.log('Обработка завершена');
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('✖ Таймаут! Обработка отменена');
            console.log('✔ Все потоки корректно закрыты');
            console.log('✔ Ресурсы освобождены');
        } else {
            console.error(error.message);
        }
    } finally {
        clearTimeout(timer);
    }
}

async function demonstrateAsyncIterator() {
    console.log('\n=== Сравнение с async iterator ===');

    const start = Date.now();
    let count = 0;

    const source = createStudents();

    for await (const student of source) {
        if (
            student.name &&
            student.group === GROUP &&
            student.course >= 1 &&
            student.course <= 4 &&
            student.grade >= 2 &&
            student.grade <= 5 &&
            student.grade > 3
        ) {
            count++;
        }
    }

    const elapsed = (Date.now() - start) / 1000;

    console.log(`[ASYNC] Обработано: ${count} записей`);
    console.log(`Время: ${elapsed.toFixed(2)} сек`);
    console.log(
        `Скорость: ${Math.round(count / Math.max(elapsed, 0.001))} записей/сек`
    );
}

let startTime;

async function main() {
    console.log(
        `=== Конвейер обработки данных (группа ${GROUP}) ===`
    );
    console.log(`Источник: ${TOTAL} студентов`);
    console.log('Фильтр: оценка > 3');

    fs.writeFileSync(
        OUTPUT,
        'id,name,group,course,grade,averageGrade\n'
    );

    fs.writeFileSync(ERROR_LOG, '');

    startTime = Date.now();

    const source = createStudents();
    const validate = new ValidateTransform();
    const enrich = new EnrichTransform();
    const filter = new FilterTransform();
    const format = new FormatTransform();
    const destination = new ProgressWritable();

    const streams = [
        source,
        validate,
        enrich,
        filter,
        format,
        destination
    ];

    for (const stream of streams) {
        stream.on('error', (error) => {
            logError(`Ошибка потока: ${error.message}`);
        });
    }

    const controller = new AbortController();

    const timeout = setTimeout(() => {
        controller.abort();
    }, 10000);

    try {
        await pipeline(
            ...streams,
            { signal: controller.signal }
        );

        clearTimeout(timeout);
        showResults(startTime);

        await demonstrateTimeout();
        await demonstrateAsyncIterator();

        console.log('\n✔ Работа конвейера завершена');
    } catch (error) {
        clearTimeout(timeout);

        if (error.name === 'AbortError') {
            console.log('\n✖ Превышено время выполнения: 10 секунд');
        } else {
            logError(`Критическая ошибка: ${error.message}`);
            console.error('Ошибка:', error.message);
        }
    }
}

main();
