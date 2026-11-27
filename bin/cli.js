
#!/usr/bin/env node

const { Command } = require('commander');

const runInit = require('../commands/init');
const runBuild = require('../commands/build');
const runDeploy = require('../commands/deploy');

const logger = require('../utils/logger');

const program = new Command();

// Обработка необработанных исключений
process.on('uncaughtException', (error) => {
    logger.error(`Непредвиденная ошибка: ${error.message}`);

    if (process.env.NODE_ENV === 'development') {
        console.error(error.stack);
    }

    process.exitCode = 1;
});

// Обработка необработанных Promise-ошибок
process.on('unhandledRejection', (reason) => {
    const message = reason instanceof Error
        ? reason.message
        : String(reason);

    logger.error(`Ошибка Promise: ${message}`);

    if (
        process.env.NODE_ENV === 'development' &&
        reason instanceof Error
    ) {
        console.error(reason.stack);
    }

    process.exitCode = 1;
});

program
    .name('mycli')
    .description('CLI-приложение для управления проектами')
    .version('1.0.0');

// Команда init
program
    .command('init <projectName>')
    .description('Создание нового проекта')
    .action((projectName) => {
        runInit(projectName);
    });

// Команда build
program
    .command('build')
    .description('Сборка проекта')
    .option('-p, --path <path>', 'Путь к проекту', '.')
    .action((options) => {
        runBuild(options);
    });

// Команда deploy
program
    .command('deploy')
    .description('Развёртывание проекта')
    .option('-f, --force', 'Подтвердить развёртывание')
    .option('--dry-run', 'Выполнить проверку без развёртывания')
    .action((options) => {
        runDeploy(options);
    });

// Обработка ошибок команд
try {
    program.parse(process.argv);
} catch (error) {
    logger.error(error.message);

    if (process.env.NODE_ENV === 'development') {
        console.error(error.stack);
    }

    process.exitCode = 1;
}
