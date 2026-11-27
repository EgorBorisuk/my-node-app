
const { Command } = require('commander');
const fs = require('fs');

const program = new Command();

program
    .name('my-cli')
    .description('CLI-приложение для лабораторной работы №17')
    .version('1.0.0')
    .option('-v, --verbose', 'подробный вывод')
    .option('-p, --port <number>', 'номер порта', '3000');

const allowedTypes = ['html', 'pdf', 'json', 'csv'];

// Команда генерации отчёта
program
    .command('generate')
    .description('сгенерировать отчёт')
    .option('-t, --type <type>', 'тип отчёта', 'html')
    .option('-o, --output <path>', 'путь для сохранения')
    .option('-f, --force', 'перезаписать существующий файл')
    .option('--dry-run', 'показать что будет сделано без выполнения')
    .action((options) => {
        const verbose = program.opts().verbose;
        const type = options.type.toLowerCase();

        if (!allowedTypes.includes(type)) {
            console.error(
                `Ошибка: недопустимый тип отчёта "${type}".`
            );
            console.error(
                'Допустимые значения: html, pdf, json, csv'
            );
            process.exitCode = 1;
            return;
        }

        const output = options.output || `output.${type}`;

        if (verbose) {
            console.log('[VERBOSE] Запуск генерации отчёта...');
            console.log(`[VERBOSE] Тип отчёта: ${type}`);
            console.log(`[VERBOSE] Путь сохранения: ${output}`);
            console.log(`[VERBOSE] Порт: ${program.opts().port}`);
        }

        if (options.dryRun) {
            console.log(
                `[DRY-RUN] Будет сгенерирован отчёт типа: ${type}`
            );
            console.log(
                `[DRY-RUN] Файл будет сохранён в: ${output}`
            );
            console.log(
                '[DRY-RUN] Действия не выполнены (режим проверки)'
            );
            return;
        }

        if (fs.existsSync(output) && !options.force) {
            console.error(
                `Ошибка: файл ${output} уже существует. Используйте --force для перезаписи.`
            );
            process.exitCode = 1;
            return;
        }

        let content;

        switch (type) {
            case 'html':
                content = '<h1>Отчёт лабораторной работы №17</h1>';
                break;
            case 'json':
                content = JSON.stringify({
                    student: 'Егор Борисюк Александрович',
                    group: '401',
                    laboratory: 17
                }, null, 2);
                break;
            case 'csv':
                content = 'student,group,laboratory\nЕгор Борисюк Александрович,401,17';
                break;
            case 'pdf':
                content = 'Демонстрационный отчёт лабораторной работы №17';
                break;
        }

        fs.writeFileSync(output, content, 'utf8');

        console.log(`Отчёт успешно сгенерирован: ${output}`);
    });

// Команда конвертации файла
program
    .command('convert <input>')
    .description('конвертировать файл')
    .option('-o, --output <path>', 'путь для сохранения', 'converted.txt')
    .option('-f, --force', 'перезаписать существующий файл')
    .action((input, options) => {
        if (!fs.existsSync(input)) {
            console.error(`Ошибка: файл "${input}" не найден.`);
            process.exitCode = 1;
            return;
        }

        if (fs.existsSync(options.output) && !options.force) {
            console.error(
                `Ошибка: файл ${options.output} уже существует. Используйте --force.`
            );
            process.exitCode = 1;
            return;
        }

        const content = fs.readFileSync(input, 'utf8');
        fs.writeFileSync(options.output, content, 'utf8');

        console.log(
            `Файл успешно обработан: ${options.output}`
        );
    });

program.parse(process.argv);
