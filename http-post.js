
const http = require('http');
const querystring = require('querystring');

const PORT = 3000;
const GROUP = 'ББМО-01-23';
const MAX_SIZE = 1024 * 1024;

const server = http.createServer((req, res) => {
    const contentType = req.headers['content-type'] || '';

    function send(status, data, type = 'application/json; charset=utf-8') {
        res.writeHead(status, {
            'Content-Type': type
        });
        res.end(
            typeof data === 'string'
                ? data
                : JSON.stringify(data, null, 2)
        );
    }

    if (req.method !== 'POST' ||
        (req.url !== '/echo' && req.url !== '/form')) {
        send(404, '<h1>404 Not Found</h1>', 'text/html; charset=utf-8');
        return;
    }

    let body = Buffer.alloc(0);
    let tooLarge = false;

    req.on('data', chunk => {
        if (tooLarge) return;

        body = Buffer.concat([body, chunk]);

        if (body.length > MAX_SIZE) {
            tooLarge = true;
            send(413, {
                error: 'Payload Too Large',
                message: 'Размер тела запроса превышает 1 МБ'
            });
            req.destroy();
        }
    });

    req.on('end', () => {
        if (tooLarge) return;

        console.log(
            `[${new Date().toLocaleString('ru-RU')}] ` +
            `${req.method} ${req.url} — ${body.length} байт`
        );

        const rawBody = body.toString('utf8');

        if (req.url === '/form') {
            if (contentType.includes('application/x-www-form-urlencoded')) {
                const formData = querystring.parse(rawBody);
                send(200, formData);
            } else {
                send(400, {
                    error: 'Ожидается application/x-www-form-urlencoded'
                });
            }

            return;
        }

        if (contentType.includes('application/json')) {
            try {
                const json = JSON.parse(rawBody);

                if (json && typeof json === 'object' && !Array.isArray(json)) {
                    json.group = GROUP;
                }

                send(200, json);
            } catch (error) {
                send(400, {
                    error: 'Некорректный JSON'
                });
            }

        } else if (contentType.includes('application/x-www-form-urlencoded')) {
            send(200, querystring.parse(rawBody));

        } else if (contentType.includes('text/plain')) {
            send(200, rawBody, 'text/plain; charset=utf-8');

        } else if (contentType.includes('application/octet-stream')) {
            send(200, {
                message: 'Бинарные данные получены',
                size: body.length,
                encoding: 'base64',
                data: body.toString('base64')
            });

        } else {
            send(200, {
                contentType,
                body: rawBody
            });
        }
    });

    req.on('error', error => {
        console.error('Ошибка чтения запроса:', error.message);

        if (!res.headersSent) {
            send(500, {
                error: 'Ошибка чтения запроса'
            });
        }
    });
});

server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    console.log(`Максимальный размер тела: ${MAX_SIZE} байт`);
});
