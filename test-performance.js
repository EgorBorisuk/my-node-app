const fs = require('fs');
const path = require('path');
const util = require('util');

const writeFileAsync = util.promisify(fs.writeFile);
const unlinkAsync = util.promisify(fs.unlink);

const N = 200; // количество файлов для теста
const DIR = './perf-test';

// Подготовка директории
if (!fs.existsSync(DIR)) {
    fs.mkdirSync(DIR, { recursive: true });
}

console.log(`=== ТЕСТ ПРОИЗВОДИТЕЛЬНОСТИ (${N} файлов) ===\n`);

// 1. СИНХРОННО
console.log('1. Синхронный подход (writeFileSync)...');
console.time('Sync');
for (let i = 0; i < N; i++) {
    fs.writeFileSync(path.join(DIR, `sync-${i}.txt`), `data-${i}`);
}
console.timeEnd('Sync');
console.log('');

// 2. КОЛБЭКИ (последовательно)
console.log('2. Колбэки (последовательно)...');
console.time('Callbacks');
let completed = 0;
function writeNext(i) {
    if (i >= N) {
        console.timeEnd('Callbacks');
        console.log('');
        runPromises();
        return;
    }
    fs.writeFile(path.join(DIR, `cb-${i}.txt`), `data-${i}`, (err) => {
        if (err) throw err;
        writeNext(i + 1);
    });
}
writeNext(0);

// 3. ПРОМИСЫ (параллельно)
async function runPromises() {
    console.log('3. Промисы (параллельно, Promise.all)...');
    console.time('Promises');
    const promises = [];
    for (let i = 0; i < N; i++) {
        promises.push(
            writeFileAsync(path.join(DIR, `promise-${i}.txt`), `data-${i}`)
        );
    }
    await Promise.all(promises);
    console.timeEnd('Promises');
    console.log('');

    // Очистка
    console.log('Очистка...');
    const files = fs.readdirSync(DIR);
    for (const file of files) {
        fs.unlinkSync(path.join(DIR, file));
    }
    fs.rmdirSync(DIR);
    console.log('✅ Готово. Директория удалена.');
}