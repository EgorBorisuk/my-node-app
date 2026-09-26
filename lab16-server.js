// lab16-server.js
const express = require('express');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'lab16-secret-key-change-me';

app.use(compression());

const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests', status: 429 }
});
app.use(limiter);

app.use((req, res, next) => {
    const start = Date.now();
    const now = new Date();
    const timeString = now.toISOString().replace('T', ' ').substring(0, 19);
    res.on('finish', () => {
        const ms = Date.now() - start;
        console.log(`[${timeString}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${ms}ms`);
    });
    next();
});

app.use(express.json());

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function cacheMiddleware(req, res, next) {
    if (req.method !== 'GET') return next();
    const key = req.originalUrl;
    const entry = cache.get(key);
    if (entry && Date.now() - entry.time < CACHE_TTL) {
        res.set('X-Cache', 'HIT');
        return res.json(entry.data);
    }
    res.set('X-Cache', 'MISS');
    const originalJson = res.json.bind(res);
    res.json = (data) => {
        cache.set(key, { time: Date.now(), data });
        return originalJson(data);
    };
    next();
}

const TITLES = [
    'Война и мир', 'Преступление и наказание', 'Мастер и Маргарита', 'Анна Каренина',
    'Тихий Дон', 'Идиот', 'Братья Карамазовы', 'Отцы и дети', 'Обломов', 'Герой нашего времени',
    'Мёртвые души', 'Ревизор', 'Гроза', 'Вишнёвый сад', 'Три сестры', 'Дядя Ваня',
    'Собачье сердце', 'Белая гвардия', 'Доктор Живаго', 'Архипелаг ГУЛАГ'
];
const AUTHORS = [
    'Толстой', 'Достоевский', 'Булгаков', 'Шолохов', 'Тургенев',
    'Гончаров', 'Лермонтов', 'Гоголь', 'Островский', 'Чехов',
    'Пастернак', 'Солженицын', 'Горький', 'Куприн', 'Бунин'
];
const GENRES = ['роман', 'повесть', 'рассказ', 'поэма', 'драма', 'антиутопия'];

let books = [];
let reviews = [];
let users = [];
let nextBookId = 1;
let nextReviewId = 1;

function generateBooks(count) {
    for (let i = 0; i < count; i++) {
        const title = TITLES[Math.floor(Math.random() * TITLES.length)] + ` (изд. ${i + 1})`;
        const author = AUTHORS[Math.floor(Math.random() * AUTHORS.length)];
        const year = 1800 + Math.floor(Math.random() * 220);
        const genre = GENRES[Math.floor(Math.random() * GENRES.length)];
        const isbn = `978-5-${String(10000 + i).padStart(5, '0')}-${i % 10}-${Math.floor(Math.random() * 10)}`;
        const available = Math.random() > 0.3;
        books.push({
            id: nextBookId++,
            title, author, year, genre, isbn, available,
            reviews: []
        });
    }
}
generateBooks(100);

// Pre-create admin and user
(async () => {
    const adminHash = await bcrypt.hash('admin123', 10);
    const userHash = await bcrypt.hash('user123', 10);
    users.push({ id: 1, email: 'admin@example.com', name: 'Admin', role: 'admin', password: adminHash });
    users.push({ id: 2, email: 'user@example.com', name: 'User', role: 'user', password: userHash });
})();

function authMiddleware(req, res, next) {
    const header = req.headers['authorization'];
    if (!header) return res.status(401).json({ error: 'Authorization required', status: 401 });
    const token = header.replace('Bearer ', '');
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (e) {
        res.status(401).json({ error: 'Invalid token', status: 401 });
    }
}

function adminMiddleware(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required', status: 403 });
    }
    next();
}
const bookSchema = Joi.object({
    title: Joi.string().min(1).required(),
    author: Joi.string().min(1).required(),
    year: Joi.number().integer().min(0).max(new Date().getFullYear()).required(),
    genre: Joi.string().optional(),
    isbn: Joi.string().optional()
});

const bookUpdateSchema = Joi.object({
    title: Joi.string().min(1).optional(),
    author: Joi.string().min(1).optional(),
    year: Joi.number().integer().min(0).max(new Date().getFullYear()).optional(),
    genre: Joi.string().optional(),
    available: Joi.boolean().optional()
});

const swaggerSpec = swaggerJsdoc({
    definition: {
        openapi: '3.0.0',
        info: { title: 'Library API (Lab 16)', version: '1.0.0' },
        servers: [{ url: `http://localhost:${PORT}` }]
    },
    apis: [__filename]
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/', (req, res) => {
    res.type('html').send(`
        <!DOCTYPE html>
        <html lang="ru">
        <head><meta charset="utf-8"><title>Лабораторная работа №16</title></head>
        <body>
            <h1>Лабораторная работа №16</h1>
            <p><b>Группа:</b> 401</p>
            <p><b>Текущая дата и время:</b> ${new Date().toLocaleString('ru-RU')}</p>
            <p>Добро пожаловать на сервер Express.js!</p>
            <h3>Доступные маршруты:</h3>
            <ul>
                <li><a href="/">/</a> — главная</li>
                <li><a href="/about">/about</a> — о разработчике</li>
                <li><a href="/contacts">/contacts</a> — контакты</li>
                <li><a href="/api/books">/api/books</a> — книги</li>
                <li><a href="/api/books/stats">/api/books/stats</a> — статистика</li>
                <li><a href="/api-docs">/api-docs</a> — Swagger документация</li>
                <li><a href="/error">/error</a> — тест ошибки</li>
                <li><a href="/async-error">/async-error</a> — тест асинхронной ошибки</li>
            </ul>
        </body>
        </html>
    `);
});

app.get('/about', (req, res) => {
    res.type('html').send(`
        <!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><title>О разработчике</title></head>
        <body>
            <h1>О разработчике</h1>
            <p><b>Студент:</b> Егор Борисюк</p>
            <p><b>Группа:</b> 401</p>
            <p><b>Лабораторная работа:</b> №16 — Express.js</p>
        </body></html>
    `);
});

app.get('/contacts', (req, res) => {
    res.type('html').send(`
        <!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><title>Контакты</title></head>
        <body>
            <h1>Контакты</h1>
            <p><b>Email:</b> student@example.com</p>
            <p><b>GitHub:</b> github.com/EgorBorisuk</p>
            <p><b>Telegram:</b> @student</p>
        </body></html>
    `);
});

app.post('/auth/register', async (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'email and password are required', status: 400 });
    }
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'User already exists', status: 400 });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = {
        id: users.length + 1,
        email,
        name: name || email,
        role: 'user',
        password: hash
    };
    users.push(user);
    res.status(201).json({ message: 'Регистрация успешна', user: { id: user.id, email: user.email, role: user.role } });
});

app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials', status: 401 });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials', status: 401 });
    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});


app.get('/api/books/search', (req, res) => {
    const author = req.query.author;
    if (!author) return res.status(400).json({ error: 'author query parameter is required', status: 400 });
    const result = books.filter(b => b.author.toLowerCase() === author.toLowerCase());
    res.json(result);
});

app.get('/api/books/stats', cacheMiddleware, (req, res) => {
    const byAuthor = {};
    const byGenre = {};
    let oldest = null, newest = null, available = 0;
    for (const b of books) {
        byAuthor[b.author] = (byAuthor[b.author] || 0) + 1;
        const g = b.genre || 'unknown';
        byGenre[g] = (byGenre[g] || 0) + 1;
        if (oldest === null || b.year < oldest) oldest = b.year;
        if (newest === null || b.year > newest) newest = b.year;
        if (b.available) available++;
    }
    res.json({
        total: books.length,
        available,
        byAuthor,
        byGenre,
        oldestYear: oldest,
        newestYear: newest
    });
});

app.get('/api/books/recommendations', (req, res) => {
    const genre = req.query.genre;
    let result = books.filter(b => b.available);
    if (genre) result = result.filter(b => b.genre === genre);
    result = result.slice(0, 5);
    res.json({ genre: genre || 'any', count: result.length, items: result });
});

app.get('/api/books/available', (req, res) => {
    res.json(books.filter(b => b.available));
});

app.get('/api/books/export', (req, res) => {
    const format = req.query.format || 'json';
    if (format === 'csv') {
        const header = 'id,title,author,year,genre,isbn,available';
        const rows = books.map(b =>
            [b.id, `"${b.title}"`, b.author, b.year, b.genre, b.isbn, b.available].join(',')
        );
        res.type('text/csv').send([header, ...rows].join('\n'));
    } else {
        res.json(books);
    }
});

app.get('/api/books', (req, res) => {
    let result = [...books];
    if (req.query.author) result = result.filter(b => b.author === req.query.author);
    if (req.query.year) result = result.filter(b => b.year === parseInt(req.query.year));
    if (req.query.yearFrom) result = result.filter(b => b.year >= parseInt(req.query.yearFrom));
    if (req.query.yearTo) result = result.filter(b => b.year <= parseInt(req.query.yearTo));
    if (req.query.genre) result = result.filter(b => b.genre === req.query.genre);
    if (req.query.search) {
        const q = req.query.search.toLowerCase();
        result = result.filter(b =>
            b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
        );
    }
    if (req.query.sort) {
        const s = req.query.sort;
        const desc = s.startsWith('-');
        const field = desc ? s.substring(1) : s;
        result.sort((a, b) => {
            if (a[field] < b[field]) return desc ? 1 : -1;
            if (a[field] > b[field]) return desc ? -1 : 1;
            return 0;
        });
    }
    const total = result.length;
    const limit = parseInt(req.query.limit) || total;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    const paginated = result.slice(offset, offset + limit);
    res.json({ total, page, limit, count: paginated.length, items: paginated });
});

app.get('/api/books/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const book = books.find(b => b.id === id);
    if (!book) return res.status(404).json({ error: 'Книга не найдена', status: 404 });
    const bookReviews = reviews.filter(r => r.bookId === id);
    res.json({ ...book, reviews: bookReviews });
});


app.post('/api/books', authMiddleware, adminMiddleware, (req, res) => {
    const { error, value } = bookSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message, status: 400 });
    }
    const duplicate = books.find(b => b.title === value.title && b.author === value.author);
    if (duplicate) {
        return res.status(400).json({ error: 'Book already exists', status: 400 });
    }
    const newBook = {
        id: nextBookId++,
        title: value.title,
        author: value.author,
        year: value.year,
        genre: value.genre || 'unknown',
        isbn: value.isbn || `978-5-${String(nextBookId).padStart(5, '0')}-0-0`,
        available: true,
        reviews: []
    };
    books.push(newBook);
    cache.clear();
    res.status(201).json(newBook);
});

app.put('/api/books/:id', authMiddleware, (req, res) => {
    const id = parseInt(req.params.id);
    const book = books.find(b => b.id === id);
    if (!book) return res.status(404).json({ error: 'Книга не найдена', status: 404 });
    const { error, value } = bookUpdateSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message, status: 400 });
    }
    Object.assign(book, value);
    cache.clear();
    res.json(book);
});

app.delete('/api/books/:id', authMiddleware, adminMiddleware, (req, res) => {
    const id = parseInt(req.params.id);
    const index = books.findIndex(b => b.id === id);
    if (index === -1) return res.status(404).json({ error: 'Книга не найдена', status: 404 });
    const deleted = books.splice(index, 1)[0];
    cache.clear();
    res.json({ message: 'Книга удалена', book: deleted });
});

app.post('/api/books/:id/reviews', authMiddleware, (req, res) => {
    const id = parseInt(req.params.id);
    const book = books.find(b => b.id === id);
    if (!book) return res.status(404).json({ error: 'Книга не найдена', status: 404 });
    const { text, rating } = req.body;
    if (!text || !rating) {
        return res.status(400).json({ error: 'text and rating are required', status: 400 });
    }
    const review = {
        id: nextReviewId++,
        bookId: id,
        userId: req.user.id,
        text,
        rating,
        date: new Date().toISOString()
    };
    reviews.push(review);
    res.status(201).json(review);
});

app.get('/api/admin/stats', authMiddleware, adminMiddleware, (req, res) => {
    res.json({
        users: users.length,
        books: books.length,
        available: books.filter(b => b.available).length,
        totalReviews: reviews.length
    });
});

app.get('/error', (req, res) => {
    throw new Error('Тестовая ошибка');
});

app.get('/async-error', async (req, res, next) => {
    try {
        await Promise.reject(new Error('Асинхронная ошибка'));
    } catch (err) {
        next(err);
    }
});

// 404
app.use((req, res) => {
    res.status(404).json({ error: 'Маршрут не найден', status: 404 });
});

// Centralized error handler
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(err.status || 500).json({
        error: err.message || 'Внутренняя ошибка сервера',
        status: err.status || 500
    });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
    console.log(`Swagger: http://localhost:${PORT}/api-docs`);
    console.log('Admin: admin@example.com / admin123');
    console.log('User:  user@example.com / user123');
});