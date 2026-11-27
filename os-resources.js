
const os = require('os');

const cpus = os.cpus();

console.log('=== Информация о процессоре ===');

console.log('Количество логических ядер:', cpus.length);
console.log('Модель процессора:         ', cpus[0].model);

console.log('\nЧастота каждого ядра:');

cpus.forEach((cpu, index) => {
    console.log(`Ядро ${index + 1}: ${cpu.speed} МГц`);
});

const averageSpeed = cpus.reduce((sum, cpu) => sum + cpu.speed, 0) / cpus.length;

console.log('Средняя частота:            ', averageSpeed.toFixed(0), 'МГц');

// Информация об оперативной памяти
const totalMemory = os.totalmem();
const freeMemory = os.freemem();
const usedMemory = totalMemory - freeMemory;

const totalGB = totalMemory / (1024 ** 3);
const freeGB = freeMemory / (1024 ** 3);
const usedGB = usedMemory / (1024 ** 3);
const usedPercent = (usedMemory / totalMemory) * 100;
const freePercent = (freeMemory / totalMemory) * 100;

console.log('\n=== Информация о памяти ===');

console.log('Общий объём:   ', totalGB.toFixed(2), 'ГБ');
console.log('Свободно:      ', freeGB.toFixed(2), 'ГБ');
console.log('Использовано:  ', `${usedGB.toFixed(2)} ГБ (${usedPercent.toFixed(1)}%)`);

console.log('\n=== Средняя загрузка системы ===');

if (os.platform() === 'win32') {
    console.log('Средняя загрузка системы недоступна в Windows');
} else {
    const load = os.loadavg();

    console.log('За 1 минуту:   ', load[0].toFixed(2));
    console.log('За 5 минут:    ', load[1].toFixed(2));
    console.log('За 15 минут:   ', load[2].toFixed(2));
}

console.log('\nГруппа: 401');

if (freePercent < 20) {
    console.log('ВНИМАНИЕ: свободной оперативной памяти меньше 20%!');
} else {
    console.log('Память в норме');
}
