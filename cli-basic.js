
const args = process.argv.slice(2);

function showHelp() {
    console.log('Использование: my-cli <команда> [аргументы]');
    console.log('');
    console.log('Доступные команды:');
    console.log('  greet <имя> - поприветствовать пользователя');
    console.log('  info        - вывести информацию о группе');
}

function greet(name) {
    if (!name) {
        console.error('Ошибка: необходимо указать имя.');
        process.exitCode = 1;
        return;
    }

    console.log(
        `Привет, ${name}! Добро пожаловать в CLI-приложение группы 401.`
    );
}

function showInfo() {
    console.log('Группа: 401');
    console.log('Студент: Егор Борисюк Александрович');
    console.log('Лабораторная работа: №17');
    console.log('Дата: 2026-11-27');
}

function main() {
    const command = args[0];

    if (!command || command === '--help') {
        showHelp();
        return;
    }

    switch (command) {
        case 'greet':
            greet(args[1]);
            break;

        case 'info':
            showInfo();
            break;

        default:
            console.error(
                `Ошибка: неизвестная команда "${command}"`
            );
            console.error(
                'Для справки используйте: my-cli --help'
            );
            process.exitCode = 1;
    }
}

main();
