
const chalk = require('chalk');
const ora = require('ora');
const cliProgress = require('cli-progress');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

function logInfo(message) {
    console.error(chalk.blue(message));
}

function logSuccess(message) {
    console.error(chalk.green(message));
}

function logWarning(message) {
    console.error(chalk.yellow(message));
}

function logError(message) {
    console.error(chalk.red(message));
}

function getOption(name) {
    const index = args.indexOf(name);
    return index !== -1 ? args[index + 1] : null;
}

function hasFlag(name) {
    return args.includes(name);
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function processFiles() {
    if (args[0] !== 'process') {
        logError('Ошибка: неизвестная команда.');
        process.exitCode = 1;
        return;
    }

    const filesIndex = args.indexOf('--files');

    if (filesIndex === -1 || !args[filesIndex + 1]) {
        logError('Ошибка: укажите файлы через --files.');
        process.exitCode = 1;
        return;
    }

    const files = [];

    for (let i = filesIndex + 1; i < args.length; i++) {
        if (args[i].startsWith('--')) break;
        files.push(args[i]);
    }

    if (files.length === 0) {
        logError('Ошибка: список файлов пуст.');
        process.exitCode = 1;
        return;
    }

    const quiet = hasFlag('--quiet');
    const silent = hasFlag('--silent');
    const useSpinner = hasFlag('--spinner');
    const useProgress = hasFlag('--progress');

    const foundFiles = [];
    const missingFiles = [];

    // Поиск файлов
    if (useSpinner && !quiet && !silent) {
        const spinner = ora({
            text: 'Поиск файлов...',
            stream: process.stderr
        }).start();

        await delay(1000);

        for (const file of files) {
            if (fs.existsSync(file) && fs.statSync(file).isFile()) {
                foundFiles.push(file);
            } else {
                missingFiles.push(file);
            }
        }

        spinner.succeed('Поиск файлов завершён');
    } else {
        for (const file of files) {
            if (fs.existsSync(file) && fs.statSync(file).isFile()) {
                foundFiles.push(file);
            } else {
                missingFiles.push(file);
            }
        }
    }

    if (!quiet && !silent) {
        logInfo(`Найдено файлов: ${foundFiles.length}`);
    }

    const results = [];

    // Обработка файлов
    if (useProgress && foundFiles.length > 0 && !quiet && !silent) {
        const bar = new cliProgress.SingleBar({
            format: 'Обработка |{bar}| {percentage}% | {value}/{total} | ETA: {eta}s',
            barCompleteChar: '█',
            barIncompleteChar: '░',
            hideCursor: true,
            stream: process.stderr
        });

        bar.start(foundFiles.length, 0);

        for (let i = 0; i < foundFiles.length; i++) {
            await delay(500);

            const content = fs.readFileSync(foundFiles[i], 'utf8');

            results.push({
                file: foundFiles[i],
                status: 'processed',
                size: Buffer.byteLength(content, 'utf8')
            });

            bar.update(i + 1);
        }

        bar.stop();
    } else {
        for (const file of foundFiles) {
            await delay(200);

            const content = fs.readFileSync(file, 'utf8');

            results.push({
                file: file,
                status: 'processed',
                size: Buffer.byteLength(content, 'utf8')
            });
        }
    }

    // Формирование результата в stdout
    const output = {
        total: files.length,
        processed: results.length,
        missing: missingFiles.length,
        results: results
    };

    console.log(JSON.stringify(output, null, 2));

    // Сообщения и предупреждения направляются в stderr
    if (!quiet && !silent) {
        for (const result of results) {
            logSuccess(`Файл ${result.file} обработан`);
        }

        for (const file of missingFiles) {
            logError(`Файл ${file} не найден`);
        }

        if (missingFiles.length > 0) {
            logWarning(`Пропущено файлов: ${missingFiles.length}`);
        } else {
            logSuccess('Обработка завершена');
        }
    }

    if (missingFiles.length > 0) {
        process.exitCode = 1;
    }
}

async function main() {
    if (hasFlag('--help') || args.length === 0) {
        console.log('Использование: node cli-visual.cjs process --files <файлы>');
        console.log('');
        console.log('Опции:');
        console.log('  --spinner    показать спиннер');
        console.log('  --progress   показать прогресс-бар');
        console.log('  --quiet      скрыть сообщения об успехе');
        console.log('  --silent     отключить все сообщения об успехе');
        console.log('  --help       показать справку');
        return;
    }

    await processFiles();
}

main().catch(error => {
    logError(`Критическая ошибка: ${error.message}`);
    process.exitCode = 1;
});
