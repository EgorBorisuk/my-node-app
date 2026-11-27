
const os = require('os');
const fs = require('fs');

const GROUP = '401';
const LOG_FILE = 'monitor.log';
const INTERVAL = 2000;

let warningCount = 0;
let isStopping = false;

function getDateTime() {
    const date = new Date();

    return date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0') + ' ' +
        String(date.getHours()).padStart(2, '0') + ':' +
        String(date.getMinutes()).padStart(2, '0') + ':' +
        String(date.getSeconds()).padStart(2, '0');
}

// Маскирование MAC-адресов
function getMaskedNetworkInterfaces() {
    const interfaces = os.networkInterfaces();
    const result = {};

    for (const [name, addresses] of Object.entries(interfaces)) {
        result[name] = addresses.map(address => {
            let mac = address.mac;

            if (mac && mac !== '00:00:00:00:00:00') {
                const parts = mac.split(':');
                if (parts.length === 6) {
                    mac = parts.slice(0, 3).join(':') + ':**:**:**';
                }
            }

            return {
                address: address.address,
                family: address.family,
                mac,
                internal: address.internal
            };
        });
    }

    return result;
}

// Первичный сбор данных
function getSystemSnapshot() {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const user = os.userInfo();

    return {
        timestamp: new Date().toISOString(),
        group: GROUP,
        platform: os.platform(),
        type: os.type(),
        architecture: os.arch(),
        release: os.release(),
        hostname: os.hostname(),
        uptime: os.uptime(),

        cpu: {
            cores: cpus.length,
            model: cpus[0].model,
            speeds: cpus.map(cpu => cpu.speed)
        },

        memory: {
            total: totalMemory,
            free: freeMemory,
            used: totalMemory - freeMemory,
            freePercent: (freeMemory / totalMemory) * 100
        },

        loadAverage: os.platform() === 'win32'
            ? 'Недоступно в Windows'
            : os.loadavg(),

        networkInterfaces: getMaskedNetworkInterfaces(),

        user: {
            username: user.username,
            homeDirectory: os.homedir(),
            uid: process.platform === 'win32' ? 'Недоступно в Windows' : user.uid,
            gid: process.platform === 'win32' ? 'Недоступно в Windows' : user.gid
        }
    };
}

// Расчёт загрузки CPU
function calculateCpuUsage(previous, current) {
    let idleDifference = 0;
    let totalDifference = 0;

    for (let i = 0; i < current.length; i++) {
        const previousTotal = Object.values(previous[i].times)
            .reduce((sum, value) => sum + value, 0);

        const currentTotal = Object.values(current[i].times)
            .reduce((sum, value) => sum + value, 0);

        idleDifference += current[i].times.idle - previous[i].times.idle;
        totalDifference += currentTotal - previousTotal;
    }

    if (totalDifference <= 0) return 0;

    const busyDifference = totalDifference - idleDifference;

    return (busyDifference / totalDifference) * 100;
}

// Запись предупреждения в файл
function writeWarning(message) {
    const entry =
        `[${getDateTime()}] [${GROUP}] Предупреждение: ${message}\n`;

    fs.appendFileSync(LOG_FILE, entry, 'utf8');
    warningCount++;
}

// Вывод первичного снимка
const snapshot = getSystemSnapshot();

console.log('=== Первичный сбор данных системы ===');
console.log(JSON.stringify(snapshot, null, 2));

console.log(`\nМониторинг (группа ${GROUP}). Ctrl+C для выхода.`);

// Первый замер процессора
let previousCpus = os.cpus();

// Мониторинг каждые 2 секунды
const monitor = setInterval(() => {
    const currentCpus = os.cpus();

    const cpuUsage = calculateCpuUsage(previousCpus, currentCpus);
    previousCpus = currentCpus;

    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();

    const freeGB = freeMemory / (1024 ** 3);
    const usedPercent = ((totalMemory - freeMemory) / totalMemory) * 100;
    const freePercent = (freeMemory / totalMemory) * 100;

    let cpuStatus = 'Норма';
    let cpuWarning = '';

    if (cpuUsage > 80) {
        cpuStatus = 'КРИТИЧНО';
        cpuWarning = ' ⚠⚠';
        writeWarning(`Критическая загрузка CPU: ${cpuUsage.toFixed(1)}%`);
    } else if (cpuUsage > 50) {
        cpuStatus = 'ВНИМАНИЕ';
        cpuWarning = ' ⚠';
        writeWarning(`Высокая загрузка CPU: ${cpuUsage.toFixed(1)}%`);
    }

    let memoryWarning = '';

    if (freePercent < 10) {
        memoryWarning = ' ⚠ Мало свободной памяти';
        writeWarning(`Свободной памяти меньше 10%: ${freePercent.toFixed(1)}%`);
    }

    process.stdout.write(
        `\rCPU: ${cpuUsage.toFixed(1)}% (${cpuStatus}) | ` +
        `RAM: ${usedPercent.toFixed(1)}% (${freeGB.toFixed(2)} ГБ свободно)` +
        cpuWarning + memoryWarning + '          '
    );

}, INTERVAL);

// Завершение по Ctrl+C
process.on('SIGINT', () => {
    if (isStopping) return;

    isStopping = true;
    clearInterval(monitor);

    console.log('\n\nМониторинг остановлен.');
    console.log('Предупреждений:', warningCount);

    process.exit(0);
});
