const HybridFileManager = require('./fileOperationsHybrid');
const fm = new HybridFileManager('./test-data-hybrid');

console.log('=== ТЕСТИРОВАНИЕ ГИБРИДНОГО ПОДХОДА ===\n');

// === РЕЖИМ ПРОМИСОВ ===
(async () => {
    console.log('--- Режим ПРОМИСОВ ---');

    console.log('1. Создание файла...');
    const path1 = await fm.createFile('promise.txt', 'Привет из промиса');
    console.log(`   ✅ Создан: ${path1}`);

    console.log('\n2. Чтение файла...');
    const content1 = await fm.readFile('promise.txt');
    console.log(`   ✅ Прочитано: "${content1}"`);

    console.log('\n3. Статистика...');
    const stats = await fm.getFileStats('promise.txt');
    console.log(`   ✅ Размер: ${stats.size} байт`);

    // === РЕЖИМ КОЛБЭКОВ ===
    console.log('\n--- Режим КОЛБЭКОВ ---');

    console.log('4. Создание файла...');
    fm.createFile('callback.txt', 'Привет из колбэка', (err, path2) => {
        if (err) return console.error('   ❌ Ошибка:', err.message);
        console.log(`   ✅ Создан: ${path2}`);

        console.log('\n5. Чтение файла...');
        fm.readFile('callback.txt', (err, content2) => {
            if (err) return console.error('   ❌ Ошибка:', err.message);
            console.log(`   ✅ Прочитано: "${content2}"`);

            console.log('\n6. Список файлов...');
            fm.listFiles((err, files) => {
                if (err) return console.error('   ❌ Ошибка:', err.message);
                console.log(`   ✅ Файлы:`);
                files.forEach(f => console.log(`     - ${f}`));

                console.log('\n7. Очистка...');
                fm.deleteFile('promise.txt', (err) => {
                    if (err) return console.error('   ❌ Ошибка:', err.message);
                    console.log('   ✅ promise.txt удалён');

                    fm.deleteFile('callback.txt', (err) => {
                        if (err) return console.error('   ❌ Ошибка:', err.message);
                        console.log('   ✅ callback.txt удалён');
                        console.log('\n✅ Гибридный подход работает!');
                    });
                });
            });
        });
    });
})();