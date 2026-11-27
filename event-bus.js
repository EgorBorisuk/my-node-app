
const EventEmitter = require('events');
const os = require('os');
const http = require('http');

const GROUP = 'ББМО-01-23';

// Класс EventBus
class EventBus extends EventEmitter {
    constructor() {
        super();

        this.events = new Map();
        this.anyListeners = [];
        this.metrics = {
            events: {},
            total: 0,
            lastEventTime: null
        };
    }

    // Обычная подписка с приоритетом
    on(event, listener, priority = 0) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }

        this.events.get(event).push({
            listener,
            priority,
            once: false
        });

        this.events.get(event).sort((a, b) => b.priority - a.priority);

        return this;
    }

    // Одноразовая подписка
    once(event, listener, priority = 0) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }

        this.events.get(event).push({
            listener,
            priority,
            once: true
        });

        this.events.get(event).sort((a, b) => b.priority - a.priority);

        return this;
    }

    // Подписка на все события
    onAny(listener) {
        this.anyListeners.push(listener);
        return this;
    }

    // Удаление слушателя
    off(event, listener) {
        if (this.events.has(event)) {
            const listeners = this.events.get(event);

            this.events.set(
                event,
                listeners.filter(item => item.listener !== listener)
            );
        }

        return this;
    }

    // Генерация события
    emit(event, ...args) {
        this.metrics.events[event] =
            (this.metrics.events[event] || 0) + 1;

        this.metrics.total++;
        this.metrics.lastEventTime = new Date().toISOString();

        // Вызов wildcard-слушателей
        for (const listener of this.anyListeners) {
            try {
                listener(event, ...args);
            } catch (error) {
                console.log(`[${GROUP}] Ошибка wildcard: ${error.message}`);
            }
        }

        const listeners = this.events.get(event) || [];

        // Копия списка для безопасного удаления once
        for (const item of [...listeners]) {
            if (item.once) {
                this.off(event, item.listener);
            }

            try {
                item.listener(...args);
            } catch (error) {
                if (event !== 'error') {
                    this.emit('error', error);
                } else {
                    console.log(`[${GROUP}] Ошибка: ${error.message}`);
                }
            }
        }

        return listeners.length > 0 || this.anyListeners.length > 0;
    }

    // Получение метрик
    getMetrics() {
        const listeners = {};

        for (const [event, items] of this.events) {
            listeners[event] = items.length;
        }

        return {
            group: GROUP,
            events: this.metrics.events,
            total: this.metrics.total,
            lastEventTime: this.metrics.lastEventTime,
            listeners
        };
    }
}


// Создание EventBus
const bus = new EventBus();

console.log('=== EventBus: группа ББМО-01-23 ===');

// Обработка ошибок с высоким приоритетом
bus.on('error', (error) => {
    console.log(`[${GROUP}] Обработка ошибки: ${error.message}`);
}, 100);


// Демонстрация приоритетов
console.log('\n=== Приоритеты слушателей ===');

bus.on('task', () => {
    console.log('Приоритет 1: обычный слушатель');
}, 1);

bus.on('task', () => {
    console.log('Приоритет 10: высокий приоритет');
}, 10);

bus.on('task', () => {
    console.log('Приоритет 5: средний приоритет');
}, 5);

bus.emit('task');


// Демонстрация wildcard
console.log('\n=== Wildcard-подписка ===');

bus.onAny((event, ...args) => {
    console.log(`[WILDCARD] Событие: ${event}`, ...args);
});

bus.emit('greet', 'Егор');
bus.emit('info', GROUP);


// Демонстрация once
console.log('\n=== Одноразовая подписка once ===');

bus.once('welcome', () => {
    console.log('Одноразовый слушатель вызван');
});

bus.emit('welcome');
bus.emit('welcome');


// Демонстрация обработки ошибок
console.log('\n=== Обработка ошибок ===');

bus.on('test-error', () => {
    throw new Error('Тестовая ошибка слушателя');
});

bus.emit('test-error');


// Интеграция с модулем os
console.log('\n=== Мониторинг системы OS ===');

bus.on('system:info', (info) => {
    console.log('Операционная система:', info.platform);
    console.log('Архитектура:', info.arch);
    console.log('Свободная память:', info.freeMemory, 'байт');
});

bus.emit('system:info', {
    platform: os.platform(),
    arch: os.arch(),
    freeMemory: os.freemem()
});


// Получение метрик
console.log('\n=== Метрики EventBus ===');

console.log(JSON.stringify(bus.getMetrics(), null, 2));


// HTTP-сервер
const server = http.createServer((req, res) => {
    bus.emit('request', {
        method: req.method,
        url: req.url
    });

    if (req.url === '/metrics') {
        res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8'
        });

        res.end(JSON.stringify(bus.getMetrics(), null, 2));
    } else {
        res.writeHead(200, {
            'Content-Type': 'text/plain; charset=utf-8'
        });

        res.end(`EventBus работает. Группа: ${GROUP}`);
    }
});

server.listen(3000, () => {
    console.log('\n=== HTTP-сервер ===');
    console.log('Сервер запущен: http://localhost:3000');
    console.log('Метрики: http://localhost:3000/metrics');
    console.log('Для остановки нажмите Ctrl+C');
});
