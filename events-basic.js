
const EventEmitter = require('events');

// Создание экземпляра EventEmitter
const emitter = new EventEmitter();

console.log('=== Демонстрация EventEmitter ===\n');

// Регистрация слушателя greet
emitter.on('greet', (name) => {
    console.log(`[greet] Привет, ${name}!`);
});

// Регистрация слушателя info
emitter.on('info', () => {
    console.log('[info] Группа: ББМО-01-23');
});

// Регистрация слушателя bye
emitter.on('bye', () => {
    console.log('[bye] До свидания!');
});

// Вызов событий по очереди
emitter.emit('greet', 'Егор');
emitter.emit('info');
emitter.emit('bye');

// Демонстрация возвращаемого значения emit()
console.log(
    '\nСобытие "unknown" без слушателей:',
    emitter.emit('unknown')
);

console.log(
    '\nСобытие "greet" со слушателями:',
    emitter.emit('greet', 'Егор')
);
