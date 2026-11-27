
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 3000;
const HTTPS_PORT = 3443;
const GROUP = 'ББМО-01-23';

const PUBLIC_DIR = path.join(__dirname, 'public');
const LOG_FILE = path.join(__dirname, 'access.log');
const STREAM_FILE = path.join(__dirname, 'big-file.txt');

const cache = new Map();
const CACHE_TTL = 60 * 1000;

const metrics = {
    total: 0,
    byMethod: {},
    byStatus: {}
};

const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml'
};

// Middleware 1: логирование и метрики
function logger(req, res, next) {
    metrics.total++;
    metrics.byMethod[req.method] =
        (metrics.byMethod[req.method] || 0) + 1;

    const originalWriteHead = res.writeHead;

    res.writeHead = function (statusCode, ...args) {
        res.statusCode = statusCode;
        return originalWriteHead.call(this, statusCode, ...args);
    };

    const originalEnd = res.end;

    res.end = function (...args) {
        const status = String(res.statusCode || 200);

        metrics.byStatus[status] =
            (metrics.byStatus[status] || 0) + 1;

        const line =
            `[${new Date().toLocaleString('ru-RU')}] ` +
            `[${GROUP}] ${req.method} ${req.url} ${status}\n`;

        fs.appendFile(LOG_FILE, line, error => {
            if (error) console.error('Ошибка записи лога:', error.message);
        });

        return originalEnd.apply(this, args);
    };

    next();
}

// Middleware 2: заголовки
function headers(req, res, next) {
    res.setHeader('X-Group', 'BBMO-01-23');
    res.setHeader('X-Powered-By', 'Node.js');
    next();
}

// Middleware 3: обработка ошибок
function errorHandler(req, res, next) {
    try {
        next();
    } catch (error) {
        console.error('Ошибка middleware:', error.message);

        if (!res.headersSent) {
            res.writeHead(500, {
                'Content-Type': 'text/plain; charset=utf-8'
            });
            res.end('500 Internal Server Error');
        }
    }
}

const middlewares = [logger, headers, errorHandler];

function runMiddlewares(req, res, index = 0) {
    if (index >= middlewares.length) {
        return handleRequest(req, res);
    }

    middlewares[index](req, res, () => {
        runMiddlewares(req, res, index + 1);
    });
}

function send(res, status, data, type = 'text/plain; charset=utf-8') {
    if (res.writableEnded) return;

    res.writeHead(status, {
        'Content-Type': type
    });

    res.end(data);
}

// Кэширование GET-запросов
function getCached(key) {
    const item = cache.get(key);

    if (!item) return null;

    if (Date.now() > item.expires) {
        cache.delete(key);
        return null;
    }

    return item;
}

function setCached(key, value) {
    cache.set(key, {
        value,
        expires: Date.now() + CACHE_TTL
    });
}

// Отдача статических файлов
function serveStatic(req, res, pathname) {
    let relativePath;

    try {
        relativePath = decodeURIComponent(
            pathname.replace(/^\/static\/?/, '')
        );
    } catch {
        return send(res, 400, '400 Bad Request');
    }

    if (
        relativePath.includes('..') ||
        path.isAbsolute(relativePath)
    ) {
        return send(res, 403, '403 Forbidden');
    }

    const filePath = path.resolve(PUBLIC_DIR, relativePath);
    const rootPath = path.resolve(PUBLIC_DIR) + path.sep;

    if (!filePath.startsWith(rootPath)) {
        return send(res, 403, '403 Forbidden');
    }

    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        return send(res, 404, '404 File Not Found');
    }

    const stat = fs.statSync(filePath);
    const etag = '"' + crypto
        .createHash('md5')
        .update(`${stat.size}-${stat.mtimeMs}`)
        .digest('hex') + '"';

    const lastModified = stat.mtime.toUTCString();

    res.setHeader(
        'Content-Type',
        mimeTypes[path.extname(filePath).toLowerCase()] ||
        'application/octet-stream'
    );

    res.setHeader('ETag', etag);
    res.setHeader('Last-Modified', lastModified);
    res.setHeader('Cache-Control', 'max-age=60');

    if (req.headers['if-none-match'] === etag) {
        return send(res, 304, '');
    }

    if (
        req.headers['if-modified-since'] &&
        new Date(req.headers['if-modified-since']) >=
        new Date(Math.floor(stat.mtimeMs / 1000) * 1000)
    ) {
        return send(res, 304, '');
    }

    const cached = getCached(filePath);

    if (cached) {
        return send(res, 200, cached.value,
            mimeTypes[path.extname(filePath).toLowerCase()] ||
            'application/octet-stream');
    }

    const content = fs.readFileSync(filePath);
    setCached(filePath, content);

    send(
        res,
        200,
        content,
        mimeTypes[path.extname(filePath).toLowerCase()] ||
        'application/octet-stream'
    );
}

// Обработка маршрутов
function handleRequest(req, res) {
    const parsedUrl = new URL(req.url, 'http://localhost');
    const pathname = parsedUrl.pathname;

    if (req.method === 'GET' && pathname === '/') {
        return send(
            res,
            200,
            `<h1>Лабораторная работа №20</h1>
             <p>Группа: ${GROUP}</p>
             <p>HTTP-сервер работает!</p>`,
            'text/html; charset=utf-8'
        );
    }

    if (req.method === 'GET' && pathname.startsWith('/static/')) {
        return serveStatic(req, res, pathname);
    }

    if (req.method === 'GET' && pathname === '/metrics') {
        return send(res, 200, JSON.stringify({
            group: GROUP,
            total: metrics.total,
            byMethod: metrics.byMethod,
            byStatus: metrics.byStatus,
            uptime: Math.floor(process.uptime())
        }, null, 2), 'application/json; charset=utf-8');
    }

    if (req.method === 'GET' && pathname === '/stream') {
        if (!fs.existsSync(STREAM_FILE)) {
            return send(res, 404, 'Файл для стриминга не найден');
        }

        const stat = fs.statSync(STREAM_FILE);

        res.writeHead(200, {
            'Content-Type': 'application/octet-stream',
            'Content-Length': stat.size,
            'Content-Disposition': 'attachment; filename="big-file.txt"'
        });

        const stream = fs.createReadStream(STREAM_FILE);

        stream.on('error', error => {
            console.error('Ошибка стриминга:', error.message);
            if (!res.headersSent) {
                send(res, 500, 'Ошибка чтения файла');
            } else {
                res.destroy(error);
            }
        });

        stream.pipe(res);
        return;
    }

    if (req.method === 'GET' && pathname === '/api/data') {
        const cached = getCached('api-data');

        if (cached) {
            return send(res, 200, cached.value,
                'application/json; charset=utf-8');
        }

        const data = JSON.stringify({
            group: GROUP,
            message: 'Данные API',
            updatedAt: new Date().toISOString()
        }, null, 2);

        setCached('api-data', data);

        res.setHeader('Cache-Control', 'max-age=60');

        return send(res, 200, data,
            'application/json; charset=utf-8');
    }

    if (req.method === 'POST' && pathname === '/api/data') {
        cache.clear();

        return send(res, 200, JSON.stringify({
            message: 'Кэш очищен'
        }), 'application/json; charset=utf-8');
    }

    send(res, 404, '404 Not Found');
}

// Создание HTTP-сервера
const httpServer = http.createServer((req, res) => {
    runMiddlewares(req, res);
});

// Обработка ошибок HTTP
httpServer.on('error', error => {
    console.error('Ошибка HTTP-сервера:', error.message);
});

httpServer.on('clientError', (error, socket) => {
    console.error('Ошибка клиента:', error.message);

    if (socket.writable) {
        socket.end(
            'HTTP/1.1 400 Bad Request\r\n' +
            'Connection: close\r\n\r\n'
        );
    }
});

// Запуск HTTPS при наличии сертификатов
let httpsServer = null;

const keyPath = path.join(__dirname, 'key.pem');
const certPath = path.join(__dirname, 'cert.pem');

if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    httpsServer = https.createServer({
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
    }, (req, res) => {
        runMiddlewares(req, res);
    });

    httpsServer.on('error', error => {
        console.error('Ошибка HTTPS-сервера:', error.message);
    });

    httpsServer.listen(HTTPS_PORT, () => {
        console.log(`HTTPS-сервер запущен на порту ${HTTPS_PORT}`);
    });
} else {
    console.log('HTTPS не запущен: отсутствуют key.pem и cert.pem');
}

httpServer.listen(PORT, () => {
    console.log(`HTTP-сервер запущен на порту ${PORT}`);
    console.log(`Группа: ${GROUP}`);
});

// Корректное завершение
function shutdown() {
    console.log('\nЗавершение работы серверов...');

    httpServer.close(() => {
        console.log('HTTP-сервер остановлен');
    });

    if (httpsServer) {
        httpsServer.close(() => {
            console.log('HTTPS-сервер остановлен');
        });
    }

    setTimeout(() => process.exit(0), 1000);
}

process.on('SIGINT', shutdown);
