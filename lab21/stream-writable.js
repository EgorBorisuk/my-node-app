
const { Writable } = require('stream');

const GROUP = 'ББМО-01-23';

console.log('=== Демонстрация Writable-потока ===\n');

const chunks = [
    'GROUP',
    'STUDENT',
    'LAB21',
    'STREAMS'
];

let writtenCount = 0;
let currentIndex = 0;

const writable = new Writable({
    highWaterMark: 16,

    write(chunk, encoding, callback) {
        setTimeout(() => {
            writtenCount++;
            console.log(`[WRITE] ${chunk.toString()}`);
            callback();
        }, 300);
    }
});

writable.on('drain', () => {
    console.log('\n[DRAIN] Буфер освобождён, продолжаем запись\n');
    writeNext();
});

writable.on('finish', () => {
    console.log('\n[FINISH] Все данные записаны');
    console.log(`Всего записано: ${writtenCount} чанка`);
});

writable.on('error', (error) => {
    console.error('[ERROR]', error.message);
});

function writeNext() {
    while (currentIndex < chunks.length) {
        const chunk = chunks[currentIndex];
        currentIndex++;

        const canContinue = writable.write(chunk);

        console.log(`write() вернул: ${canContinue}`);

        if (!canContinue) {
            console.log('Буфер переполнен! Ожидаем drain.\n');
            return;
        }
    }

    writable.end();
}

console.log(`Группа: ${GROUP}`);
console.log('Размер буфера: 16 байт\n');

writeNext();
