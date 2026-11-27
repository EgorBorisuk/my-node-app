
const http = require('http');

const PORT = 3000;
const GROUP = 'ББМО-01-23';
const STUDENT = 'Егор Борисюк Александрович';

const server = http.createServer((req, res) => {
    const date = new Date().toLocaleString('ru-RU');

    let statusCode = 200;
    let content = '';

    if (req.method === 'GET' && req.url === '/') {
        content = `
            <!DOCTYPE html>
            <html lang="ru">
            <head><meta charset="UTF-8"><title>Лабораторная №20</title></head>
            <body>
                <h1>Лабораторная работа №20</h1>
                <p>Группа: ${GROUP}</p>
                <p>Метод: ${req.method}</p>
                <p>URL: ${req.url}</p>
            </body>
            </html>
        `;
    } else if (req.method === 'GET' && req.url === '/about') {
        content = `
            <!DOCTYPE html>
            <html lang="ru">
            <head><meta charset="UTF-8"><title>О студенте</title></head>
            <body>
                <h1>О студенте</h1>
                <p>Группа: ${GROUP}</p>
                <p>Студент: ${STUDENT}</p>
            </body>
            </html>
        `;
    } else {
        statusCode = 404;
        content = `
            <!DOCTYPE html>
            <html lang="ru">
            <head><meta charset="UTF-8"><title>404</title></head>
            <body>
                <h1>404 Not Found</h1>
                <p>Путь ${req.url} не найден</p>
            </body>
            </html>
        `;
    }

    console.log(`[${date}] ${req.method} ${req.url} ${statusCode}`);

    res.writeHead(statusCode, {
        'Content-Type': 'text/html; charset=utf-8'
    });

    res.end(content);
});

server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
