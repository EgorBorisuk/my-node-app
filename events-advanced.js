
const EventEmitter = require('events');

// Класс системы плагинов
class PluginManager extends EventEmitter {
    constructor() {
        super();

        // Отслеживание добавления слушателей
        this.on('newListener', (eventName, listener) => {
            if (eventName !== 'newListener') {
                console.log(`[newListener] Добавлен слушатель "${eventName}"`);
            }
        });

        // Отслеживание удаления слушателей
        this.on('removeListener', (eventName, listener) => {
            if (eventName !== 'removeListener') {
                console.log(`[removeListener] Удалён слушатель "${eventName}"`);
            }
        });
    }

    registerPlugin(name, eventName, callback) {
        this.on(eventName, callback);
        console.log(`[PLUGIN] Зарегистрирован: ${name}`);
        this.emit('plugin:registered', name);
    }

    removePlugin(name, eventName, callback) {
        this.removeListener(eventName, callback);
        console.log(`[PLUGIN] Удалён: ${name}`);
        this.emit('plugin:removed', name);
    }
}


// Демонстрация системы плагинов
console.log('=== Система плагинов ===');

const manager = new PluginManager();

manager.on('plugin:registered', (name) => {
    console.log(`[PLUGIN EVENT] Подключён плагин: ${name}`);
});

manager.on('plugin:removed', (name) => {
    console.log(`[PLUGIN EVENT] Отключён плагин: ${name}`);
});

function loggerPlugin() {
    console.log('[LoggerPlugin] Запись в журнал');
}

function alertPlugin() {
    console.log('[AlertPlugin] Создано уведомление');
}

manager.registerPlugin('LoggerPlugin', 'log', loggerPlugin);
manager.registerPlugin('AlertPlugin', 'alert', alertPlugin);

manager.emit('log');
manager.emit('alert');

manager.removePlugin('LoggerPlugin', 'log', loggerPlugin);


// Демонстрация утечки памяти
console.log('\n=== Демонстрация утечки ===');

const leakEmitter = new EventEmitter();

// Добавляем 10 слушателей
for (let i = 0; i < 10; i++) {
    leakEmitter.on('data', () => {});
}

console.log('Слушателей до:', leakEmitter.listenerCount('data'));

// Добавляем ещё 1000 слушателей
for (let i = 0; i < 1000; i++) {
    leakEmitter.on('data', () => {});
}

console.log(
    'Слушателей после добавления 1000:',
    leakEmitter.listenerCount('data')
);

// Удаляем все слушатели
leakEmitter.removeAllListeners('data');

console.log(
    'Слушателей после removeAllListeners:',
    leakEmitter.listenerCount('data')
);


// Демонстрация асинхронных слушателей
console.log('\n=== Асинхронные слушатели ===');

const asyncEmitter = new EventEmitter();

asyncEmitter.on('task', async () => {
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log(
        '[BBMO-01-23] async-слушатель завершён через 100ms'
    );
});

asyncEmitter.on('task', () => {
    setImmediate(() => {
        console.log('[BBMO-01-23] setImmediate: отложенное выполнение');
    });
});

asyncEmitter.emit('task');

console.log(
    '[BBMO-01-23] emit вызван (не ждёт async-слушатель)'
);
