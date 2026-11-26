
const { Readable } = require('stream');

const GROUP = 'ББМО-01-23';
const STUDENT = 'Егор Борисюк Александрович';

console.log('=== Демонстрация Readable-потока ===\n');

const chunks = [
    `Группа: ${GROUP}`,
    `Студент: ${STUDENT}`,
    'Лабораторная работа: №21',
    'Тема: Потоки в Node.js'
];

let index = 0;
let chunkCount = 0;
let totalBytes = 0;

const readable = new Readable({
    read(size) {
        if (index < chunks.length) {
            const chunk = chunks[index];

            this.push(chunk);
            index++;
        } else {
            this.push(null);
        }
    }
});

readable.on('data', (chunk) => {
    chunkCount++;
    totalBytes += chunk.length;

    console.log(`[CHUNK ${chunkCount}] ${chunk.toString()}`);
});

readable.on('end', () => {
    console.log('\n[END] Поток завершён');
    console.log(`Всего получено чанков: ${chunkCount}`);
    console.log(`Общий размер данных: ${totalBytes} байт`);
});

readable.on('error', (error) => {
    console.error('[ERROR]', error.message);
});
