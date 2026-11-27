
const fs = require('fs');
const path = require('path');
const { Transform } = require('stream');
const { pipeline } = require('stream/promises');

const GROUP = 'ББМО-01-23';

const INPUT = path.join(__dirname, 'input.txt');

console.log(`Группа: ${GROUP}`);

function pipeCopy() {
    return new Promise((resolve) => {
        console.log('\n=== Демонстрация pipe() ===');

        const source = fs.createReadStream(INPUT);
        const destination = fs.createWriteStream(
            path.join(__dirname, 'output-pipe.txt')
        );

        console.log('Чтение: input.txt');
        console.log('Запись: output-pipe.txt');

        source.pipe(destination);

        destination.on('finish', () => {
            const size = fs.statSync(
                path.join(__dirname, 'output-pipe.txt')
            ).size;

            console.log('✔ Копирование завершено');
            console.log(`Размер: ${size} байт`);

            resolve();
        });

        source.on('error', (error) => {
            console.log('✖ Ошибка:', error.message);
            resolve();
        });

        destination.on('error', (error) => {
            console.log('✖ Ошибка записи:', error.message);
            resolve();
        });
    });
}

function pipeError() {
    return new Promise((resolve) => {
        console.log('\n=== Демонстрация pipe() с ошибкой ===');
        console.log('Чтение: missing.txt');

        const source = fs.createReadStream(
            path.join(__dirname, 'missing.txt')
        );

        const destination = fs.createWriteStream(
            path.join(__dirname, 'output-error-pipe.txt')
        );

        source.pipe(destination);

        source.on('error', (error) => {
            console.log('✖ Ошибка:', error.code);
            console.log(
                'Состояние целевого потока:',
                destination.destroyed ? 'закрыт' : 'остаётся открытым'
            );

            console.log('⚠ pipe() не закрывает целевой поток автоматически');

            destination.destroy();
            console.log('Целевой поток закрыт вручную');

            resolve();
        });

        destination.on('error', () => {});
    });
}

async function pipelineCopy() {
    console.log('\n=== Демонстрация pipeline() ===');
    console.log('Чтение: input.txt');
    console.log('Запись: output-pipeline.txt');

    const source = fs.createReadStream(INPUT);
    const destination = fs.createWriteStream(
        path.join(__dirname, 'output-pipeline.txt')
    );

    await pipeline(source, destination);

    console.log('✔ Копирование завершено');
}

async function pipelineError() {
    console.log('\n=== Демонстрация pipeline() с ошибкой ===');
    console.log('Чтение: missing.txt');

    const source = fs.createReadStream(
        path.join(__dirname, 'missing.txt')
    );

    const destination = fs.createWriteStream(
        path.join(__dirname, 'output-error-pipeline.txt')
    );

    try {
        await pipeline(source, destination);
    } catch (error) {
        console.log('✖ Ошибка:', error.code);
        console.log('✔ Все потоки автоматически закрыты');
        console.log('✔ Ресурсы освобождены');
    }
}

async function transformChain() {
    console.log('\n=== Цепочка потоков ===');
    console.log('input.txt → uppercase → reverse → output-chain.txt');

    const uppercase = new Transform({
        transform(chunk, encoding, callback) {
            callback(null, chunk.toString().toUpperCase());
        }
    });

    const reverse = new Transform({
        transform(chunk, encoding, callback) {
            const text = chunk.toString();
            callback(null, text.split('').reverse().join(''));
        }
    });

    const source = fs.createReadStream(INPUT);
    const destination = fs.createWriteStream(
        path.join(__dirname, 'output-chain.txt')
    );

    await pipeline(source, uppercase, reverse, destination);

    console.log('✔ Обработка завершена');
}

async function main() {
    try {
        await pipeCopy();
        await pipeError();
        await pipelineCopy();
        await pipelineError();
        await transformChain();

        console.log('\n=== Сравнение файлов ===');

        const original = fs.readFileSync(INPUT, 'utf8');
        const copied = fs.readFileSync(
            path.join(__dirname, 'output-pipeline.txt'),
            'utf8'
        );

        console.log(
            'Содержимое совпадает:',
            original === copied ? 'ДА' : 'НЕТ'
        );
    } catch (error) {
        console.error('Ошибка выполнения:', error.message);
    }
}

main();
