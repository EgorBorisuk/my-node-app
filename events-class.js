
const EventEmitter = require('events');

// Класс подключения к базе данных
class DatabaseConnection extends EventEmitter {
    connect() {
        console.log('[EVENT] Подключение к БД...');
        this.emit('connect', 'Соединение установлено');
    }

    query(sql) {
        console.log(`[EVENT] Выполнение запроса: ${sql}`);

        let result;

        if (sql.startsWith('SELECT')) {
            result = '50 записей';
        } else if (sql.startsWith('INSERT')) {
            result = '1 запись добавлена';
        } else {
            result = 'Запрос выполнен';
        }

        this.emit('query', sql, result);
    }

    close() {
        this.emit('close', 'Соединение закрыто');
    }

    error(message) {
        this.emit('error', new Error(message));
    }
}

console.log('=== DatabaseConnection (группа ББМО-01-23) ===');

const database = new DatabaseConnection();

// Подписка на событие подключения
database.on('connect', (message) => {
    console.log(`[EVENT] ${message}`);
});

// Подписка на событие запроса
database.on('query', (sql, result) => {
    console.log(`[EVENT] Результат: ${result}`);
});

// Подписка на событие закрытия
database.on('close', (message) => {
    console.log(`[EVENT] ${message}`);
});

// Обработка ошибки
database.on('error', (err) => {
    console.log(`[EVENT] Ошибка: ${err.message}`);
});

// Выполнение операций
database.connect();

database.query('SELECT * FROM students');

database.query('INSERT INTO students');

console.log('[EVENT] Закрытие соединения');
database.close();


// Демонстрация обработки ошибки
console.log('\n=== Демонстрация ошибки ===');

database.error('Connection timeout');


// Демонстрация ошибки без слушателя
console.log('\n=== Ошибка без слушателя ===');

const testDatabase = new DatabaseConnection();

try {
    testDatabase.error('Нет обработчика ошибки');
} catch (err) {
    console.log('[EVENT] Перехвачено исключение:', err.message);
    console.log('(без слушателя error процесс упал бы с исключением)');
}
