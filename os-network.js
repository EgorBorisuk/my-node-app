
const os = require('os');

console.log('=== Сетевые интерфейсы ===');

const interfaces = os.networkInterfaces();

let interfaceCount = 0;
let mainInterface = null;

// Перебор всех сетевых интерфейсов
for (const [name, addresses] of Object.entries(interfaces)) {
    interfaceCount++;

    console.log(`\nИнтерфейс: ${name}`);

    for (const address of addresses) {
        const family = address.family;
        const isIPv4 = family === 'IPv4' || family === 4;
        const isIPv6 = family === 'IPv6' || family === 6;

        if (isIPv4) {
            console.log('  IPv4:', address.address);
        }

        if (isIPv6) {
            console.log('  IPv6:', address.address);
        }

        // Маскирование MAC-адреса
        const macParts = address.mac.split(':');

        let maskedMac = address.mac;

        if (macParts.length === 6 && address.mac !== '00:00:00:00:00:00') {
            maskedMac = macParts.slice(0, 3).join(':') + ':**:**:**';
        }

        console.log('  MAC:', maskedMac);
        console.log('  Внутренний:', address.internal ? 'да' : 'нет');

        // Определение первого внешнего IPv4
        if (isIPv4 && !address.internal && mainInterface === null) {
            mainInterface = {
                name,
                address: address.address
            };
        }
    }
}

console.log('\nВсего интерфейсов:', interfaceCount);

if (mainInterface) {
    console.log(
        'Основной интерфейс:',
        `${mainInterface.name} (${mainInterface.address})`
    );
} else {
    console.log('Основной интерфейс: не найден');
}

// Информация о пользователе
console.log('\n=== Информация о пользователе ===');

const user = os.userInfo();

console.log('Имя пользователя:', user.username);
console.log('Домашняя директория:', os.homedir());

if (process.platform === 'win32') {
    console.log('UID: недоступен в Windows');
    console.log('GID: недоступен в Windows');
    console.log('Оболочка:', process.env.ComSpec || 'Не определена');
} else {
    console.log('UID:', user.uid);
    console.log('GID:', user.gid);
    console.log('Оболочка:', process.env.SHELL || 'Не определена');
}

console.log('\nГруппа: 401');

// Проверка прав пользователя
console.log('\n=== Проверка безопасности ===');

if (process.platform === 'win32') {
    console.log('Проверка root: неприменима в Windows');
} else if (user.uid === 0) {
    console.log('ВНИМАНИЕ: программа запущена от имени root!');
} else {
    console.log('Проверка root: нет, пользователь не является root');
}
