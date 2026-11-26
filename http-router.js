
const http = require('http');

const PORT = 3000;
const GROUP = 'ББМО-01-23';

let students = [
    { id: 1, name: 'Иван', group: GROUP },
    { id: 2, name: 'Мария', group: GROUP }
];

let nextId = 3;

// Чтение тела POST и PUT
function readBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';

        req.on('data', chunk => {
            body += chunk;

            if (body.length > 1024 * 1024) {
                reject(new Error('Размер тела превышает 1 МБ'));
                req.destroy();
            }
        });

        req.on('end', () => resolve(body));
        req.on('error', reject);
    });
}

// Отправка JSON
function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8'
    });

    res.end(JSON.stringify(data, null, 2));
}

// Таблица маршрутов
const routes = [
    {
        method: 'GET',
        pattern: /^\/api\/students$/,
        handler: async (req, res, params, query) => {
            let result = students;

            if (query.group) {
                result = result.filter(
                    student => student.group === query.group
                );
            }

            sendJson(res, 200, result);
        }
    },
    {
        method: 'GET',
        pattern: /^\/api\/students\/(\d+)$/,
        handler: async (req, res, params) => {
            const id = Number(params[0]);
            const student = students.find(item => item.id === id);

            if (!student) {
                return sendJson(res, 404, {
                    error: 'Студент не найден'
                });
            }

            sendJson(res, 200, student);
        }
    },
    {
        method: 'POST',
        pattern: /^\/api\/students$/,
        handler: async (req, res) => {
            const body = await readBody(req);
            const data = JSON.parse(body);

            if (!data.name) {
                return sendJson(res, 400, {
                    error: 'Не указано имя студента'
                });
            }

            const student = {
                id: nextId++,
                name: data.name,
                group: data.group || GROUP
            };

            students.push(student);

            sendJson(res, 201, student);
        }
    },
    {
        method: 'PUT',
        pattern: /^\/api\/students\/(\d+)$/,
        handler: async (req, res, params) => {
            const id = Number(params[0]);
            const student = students.find(item => item.id === id);

            if (!student) {
                return sendJson(res, 404, {
                    error: 'Студент не найден'
                });
            }

            const body = await readBody(req);
            const data = JSON.parse(body);

            student.name = data.name || student.name;
            student.group = data.group || student.group;

            sendJson(res, 200, student);
        }
    },
    {
        method: 'DELETE',
        pattern: /^\/api\/students\/(\d+)$/,
        handler: async (req, res, params) => {
            const id = Number(params[0]);
            const index = students.findIndex(item => item.id === id);

            if (index === -1) {
                return sendJson(res, 404, {
                    error: 'Студент не найден'
                });
            }

            students.splice(index, 1);

            sendJson(res, 200, {
                deleted: true,
                id
            });
        }
    },
    {
        method: 'GET',
        pattern: /^\/search$/,
        handler: async (req, res, params, query) => {
            sendJson(res, 200, {
                query: query.q || '',
                limit: Number(query.limit) || 10,
                message: 'Поиск выполнен'
            });
        }
    },
    {
        method: 'GET',
        pattern: /^\/users\/(\d+)$/,
        handler: async (req, res, params) => {
            sendJson(res, 200, {
                userId: params[0]
            });
        }
    },
    {
        method: 'GET',
        pattern: /^\/users\/(\d+)\/posts\/(\d+)$/,
        handler: async (req, res, params) => {
            sendJson(res, 200, {
                userId: params[0],
                postId: params[1]
            });
        }
    }
];

// HTTP-сервер
const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = decodeURIComponent(parsedUrl.pathname);

    const query = Object.fromEntries(parsedUrl.searchParams.entries());

    let statusCode = 200;

    try {
        const route = routes.find(item =>
            item.method === req.method &&
            item.pattern.test(pathname)
        );

        if (route) {
            const match = pathname.match(route.pattern);
            const params = match ? match.slice(1) : [];

            await route.handler(req, res, params, query);
            statusCode = res.statusCode || 200;

        } else {
            const pathExists = routes.some(item =>
                item.pattern.test(pathname)
            );

            if (pathExists) {
                statusCode = 405;

                res.setHeader('Allow',
                    routes
                        .filter(item => item.pattern.test(pathname))
                        .map(item => item.method)
                        .join(', ')
                );

                sendJson(res, 405, {
                    error: 'Method Not Allowed'
                });
            } else {
                statusCode = 404;

                sendJson(res, 404, {
                    error: 'Not Found',
                    path: pathname
                });
            }
        }
    } catch (error) {
        console.error('Ошибка:', error.message);

        if (!res.headersSent) {
            statusCode = 400;

            sendJson(res, 400, {
                error: 'Ошибка обработки запроса',
                message: error.message
            });
        }
    }

    console.log(
        `[${new Date().toLocaleString('ru-RU')}] ` +
        `[${GROUP}] ${req.method} ${req.url} ${statusCode}`
    );
});

server.listen(PORT, () => {
    console.log(`HTTP-сервер запущен на порту ${PORT}`);
    console.log(`Группа: ${GROUP}`);
});
