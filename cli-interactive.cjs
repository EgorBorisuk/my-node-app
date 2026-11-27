
const { Command } = require('commander');
const inquirer = require('inquirer');

const program = new Command();

program
    .name('my-cli')
    .description('Интерактивное CLI-приложение для лабораторной №17')
    .version('1.0.0');

program
    .command('init')
    .description('инициализация проекта')
    .option('--name <name>', 'название проекта')
    .option('--type <type>', 'тип проекта')
    .option('--typescript', 'использовать TypeScript')
    .option('--no-typescript', 'не использовать TypeScript')
    .option('--prettier', 'использовать Prettier')
    .option('--no-prettier', 'не использовать Prettier')
    .option('--git', 'использовать Git')
    .option('--no-git', 'не использовать Git')
    .option('--no-interactive', 'отключить интерактивный режим')
    .action(async (options) => {
        try {
            let stdinData = '';

            // Проверка передачи данных через stdin
            const stdinPiped = !process.stdin.isTTY;

            if (stdinPiped) {
                for await (const chunk of process.stdin) {
                    stdinData += chunk;
                }
            }

            let name = options.name || stdinData.trim();
            let type = options.type;
            let extras = [];
            let useGit = options.git;
            let token = '';

            // Проверка передачи всех данных через флаги
            const allFlagsProvided =
                options.name &&
                options.type &&
                options.typescript !== undefined &&
                options.prettier !== undefined &&
                options.git !== undefined;

            const interactive =
                !options.interactive === false &&
                !stdinPiped &&
                !allFlagsProvided;

            if (interactive) {
                const answers = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'name',
                        message: 'Введите название проекта:',
                        default: name,
                        when: !name,
                        validate: (value) =>
                            value.trim().length > 0 ||
                            'Название проекта обязательно'
                    },
                    {
                        type: 'list',
                        name: 'type',
                        message: 'Выберите тип проекта:',
                        choices: [
                            { name: 'Web-приложение', value: 'web' },
                            { name: 'CLI-утилита', value: 'cli' },
                            { name: 'Библиотека', value: 'library' },
                            { name: 'Микросервис', value: 'microservice' }
                        ],
                        when: !type
                    },
                    {
                        type: 'checkbox',
                        name: 'extras',
                        message: 'Выберите дополнительные опции:',
                        choices: [
                            { name: 'TypeScript', value: 'TypeScript' },
                            { name: 'ESLint', value: 'ESLint' },
                            { name: 'Prettier', value: 'Prettier' },
                            { name: 'Jest', value: 'Jest' }
                        ],
                        when: options.typescript === undefined ||
                              options.prettier === undefined
                    },
                    {
                        type: 'confirm',
                        name: 'useGit',
                        message: 'Использовать Git?',
                        default: true,
                        when: useGit === undefined
                    },
                    {
                        type: 'password',
                        name: 'token',
                        message: 'Введите токен доступа (необязательно):'
                    }
                ]);

                name = name || answers.name;
                type = type || answers.type;
                extras = answers.extras || [];
                useGit = useGit === undefined
                    ? answers.useGit
                    : useGit;
                token = answers.token || '';
            } else {
                // Формирование дополнительных опций из флагов
                if (options.typescript) {
                    extras.push('TypeScript');
                }

                if (options.prettier) {
                    extras.push('Prettier');
                }
            }

            // Проверка обязательных параметров
            if (!name || !type) {
                console.error(
                    'Ошибка: в неинтерактивном режиме необходимо указать --name и --type'
                );
                process.exitCode = 1;
                return;
            }

            // Вывод результата
            console.log('');
            console.log(`✓ Проект "${name}" успешно инициализирован!`);

            const types = {
                web: 'Web-приложение',
                cli: 'CLI-утилита',
                library: 'Библиотека',
                microservice: 'Микросервис'
            };

            console.log(`Тип: ${types[type] || type}`);
            console.log(
                `Опции: ${extras.length ? extras.join(', ') : 'нет'}`
            );
            console.log(`Git: ${useGit ? 'да' : 'нет'}`);

            if (token) {
                console.log('Токен доступа: введён');
            }

        } catch (error) {
            console.error(`Ошибка: ${error.message}`);
            process.exitCode = 1;
        }
    });

program.parseAsync(process.argv);
