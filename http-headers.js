
const http = require('http');

const PORT = 3000;
const GROUP = 'ББМО-01-23';

const server = http.createServer((req, res) => {
    const url = req.url;

    // Общие заголовки ответа
    res.setHeader('X-Powered-By', 'Node.js');
res.setHeader('X-Group', 'BBMO-01-23');
    res.setHeader('Cache-Control', 'no-cache');

    if (req.method === 'GET' && url === '/headers') {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');

        res.end(JSON.stringify({
            headers: req.headers,
            method: req.method,
            url: req.url,
            httpVersion: req.httpVersion
        }, null, 2));

    } else if (req.method === 'GET' && url === '/headers/set') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');

        res.end(`
            <h1>Заголовки ответа установлены</h1>
            <p>X-Powered-By: ${res.getHeader('X-Powered-By')}</p>
            <p>X-Group: ${res.getHeader('X-Group')}</p>
            <p>Cache-Control: ${res.getHeader('Cache-Control')}</p>
        `);

    } else if (req.method === 'GET' && url === '/headers/check') {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');

        res.end(JSON.stringify({
            hasContentType: res.hasHeader('Content-Type'),
            hasXGroup: res.hasHeader('X-Group'),
            hasUnknown: res.hasHeader('Unknown-Header')
        }, null, 2));

    } else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end('<h1>404 Not Found</h1><p>Маршрут не найден</p>');
    }

    console.log(`[${new Date().toLocaleString('ru-RU')}] ${req.method} ${url} ${res.statusCode}`);
});

server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
