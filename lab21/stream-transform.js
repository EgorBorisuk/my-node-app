
const {
    Readable,
    Transform,
    Writable
} = require('stream');

const { pipeline } = require('stream/promises');

const GROUP = 'ББМО-01-23';

console.log('=== Демонстрация Transform-потока ===');

class UpperCaseTransform extends Transform {
    constructor(options = {}) {
        super({
            ...options,
            writableObjectMode: options.objectMode || false,
            readableObjectMode: options.objectMode || false
        });
    }

    _transform(chunk, encoding, callback) {
        if (this.writableObjectMode) {
            const student = { ...chunk };

            if (student.name) {
                student.name = student.name.toUpperCase();
            }

            callback(null, student);
        } else {
            const text = chunk.toString().toUpperCase();
            callback(null, `[${GROUP}] ${text}`);
        }
    }
}

class JsonParserTransform extends Transform {
    constructor() {
        super({
            writableObjectMode: false,
            readableObjectMode: true
        });
    }

    _transform(chunk, encoding, callback) {
        try {
            const lines = chunk.toString().split('\n');

            for (const line of lines) {
                if (line.trim()) {
                    this.push(JSON.parse(line));
                }
            }

            callback();
        } catch (error) {
            callback(error);
        }
    }
}

class FilterTransform extends Transform {
    constructor() {
        super({
            objectMode: true
        });
    }

    _transform(student, encoding, callback) {
        if (student.group === GROUP) {
            callback(null, student);
        } else {
            callback();
        }
    }
}

// 1. Демонстрация UpperCaseTransform
async function demonstrateUpperCase() {
    const upperCase = new UpperCaseTransform();

    const input = [
        'группа ббмо-01-23',
        'студент егор борисюк'
    ];

    for (const text of input) {
        console.log(`\nВход: "${text}"`);

        const output = await new Promise((resolve, reject) => {
            upperCase.once('data', chunk => resolve(chunk.toString()));
            upperCase.once('error', reject);
            upperCase.write(text);
        });

        console.log(`Выход: "${output}"`);
    }

    upperCase.end();
}

// 2. Демонстрация JsonParserTransform и FilterTransform
async function demonstrateJsonParser() {
    console.log('\n=== Демонстрация JsonParserTransform ===');

    const jsonData = [
        '{"id":1,"name":"Иван","group":"ББМО-01-23"}',
        '{"id":2,"name":"Мария","group":"ББМО-02-23"}',
        '{"id":3,"name":"Петр","group":"ББМО-01-23"}'
    ].join('\n');

    const parser = new JsonParserTransform();
    const filter = new FilterTransform();

    const students = [];

    await pipeline(
        Readable.from([jsonData]),
        parser,
        filter,
        new Writable({
            objectMode: true,

            write(student, encoding, callback) {
                students.push(student);
                console.log('[OBJECT]', student);
                callback();
            }
        })
    );

    console.log('\nПосле фильтрации (только ББМО-01-23):');

    for (const student of students) {
        console.log('[OBJECT]', student);
    }
}

// 3. Демонстрация асинхронного итератора
async function demonstrateAsyncIterator() {
    console.log('\n=== Демонстрация async iterator ===');

    const readable = Readable.from([
        'Данные 1',
        'Данные 2',
        'Данные 3'
    ]);

    let index = 0;

    for await (const chunk of readable) {
        index++;
        console.log(
            `[ASYNC] Получен чанк ${index}: "${chunk.toString()}"`
        );
    }

    console.log('[ASYNC] Поток завершён');
}

// 4. Демонстрация Object Mode и цепочки Transform
async function demonstrateObjectMode() {
    console.log('\n=== Демонстрация Object Mode ===');

    const students = [
        { id: 1, name: 'Иван', group: 'ББМО-01-23' },
        { id: 2, name: 'Мария', group: 'ББМО-02-23' },
        { id: 3, name: 'Петр', group: 'ББМО-01-23' }
    ];

    const source = Readable.from(students, {
        objectMode: true
    });

    const upperCase = new UpperCaseTransform({
        objectMode: true
    });

    const filter = new FilterTransform();

    const destination = new Writable({
        objectMode: true,

        write(student, encoding, callback) {
            console.log('[RESULT]', student);
            callback();
        }
    });

    console.log('Цепочка: readable → upperCase → filter → writable');

    await pipeline(
        source,
        upperCase,
        filter,
        destination
    );

    console.log('✔ Цепочка Transform завершена');
}

// Запуск всех демонстраций
async function main() {
    try {
        await demonstrateUpperCase();
        await demonstrateJsonParser();
        await demonstrateAsyncIterator();
        await demonstrateObjectMode();

        console.log('\n✔ Все демонстрации завершены');
    } catch (error) {
        console.error('[ERROR]', error.message);
    }
}

main();
