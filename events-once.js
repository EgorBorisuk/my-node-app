
const EventEmitter = require('events');

console.log('=== Сравнение on и once ===');

const emitter = new EventEmitter();

let onCount = 0;
let onceCount = 0;

// Слушатель on() срабатывает при каждом вызове события
emitter.on('tick', () => {
    onCount++;
    console.log(`[tick #${onCount}] on-слушатель`);
});

// Слушатель once() срабатывает только один раз
emitter.once('tick', () => {
    onceCount++;
    console.log(`[tick #${onCount}] once-слушатель (группа ББМО-01-23)`);
});

// Три вызова события
emitter.emit('tick');
emitter.emit('tick');
emitter.emit('tick');

console.log(`on-слушатель вызван: ${onCount} раза`);
console.log(`once-слушатель вызван: ${onceCount} раз`);


// Управление подписками
console.log('\n=== Управление подписками ===');

const manager = new EventEmitter();

function listener1() {
    console.log('Первый слушатель');
}

function listener2() {
    console.log('Второй слушатель');
}

function listener3() {
    console.log('Третий слушатель');
}

// Добавление трёх слушателей
manager.on('message', listener1);
manager.on('message', listener2);
manager.on('message', listener3);

console.log('Слушателей до удаления:', manager.listenerCount('message'));

// Получение списка слушателей
console.log('Список слушателей:', manager.listeners('message').length);

// Удаление одного слушателя
manager.removeListener('message', listener1);

console.log('Слушателей после удаления одного:', manager.listenerCount('message'));

// Удаление всех слушателей события
manager.removeAllListeners('message');

console.log('Слушателей после removeAllListeners:', manager.listenerCount('message'));


// Демонстрация порядка вызова
console.log('\n=== Порядок вызова ===');

const orderEmitter = new EventEmitter();

orderEmitter.on('order', () => {
    console.log('1. Первый слушатель (группа ББМО-01-23)');
});

orderEmitter.on('order', () => {
    console.log('2. Второй слушатель');
});

orderEmitter.on('order', () => {
    console.log('3. Третий слушатель');
});

orderEmitter.emit('order');
