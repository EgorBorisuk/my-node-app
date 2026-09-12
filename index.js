const http = require('http');
const { EventEmitter } = require('events');

function calculatePi(iterations = 1000000) {
  let inside = 0;
  for (let i = 0; i < iterations; i++) {
    const x = Math.random();
    const y = Math.random();
    if (x * x + y * y <= 1) {
      inside++;
    }
  }
  return (inside / iterations) * 4;
}

const fullName = "Борисюк Егор Александрович";
const group = "401";
const journalNumber = 1;

class AppServer extends EventEmitter {
  constructor() {
    super();
    this.server = null;
    this.piRounded = calculatePi(1000000).toFixed(journalNumber);
  }

  start(port) {
    this.server = http.createServer((req, res) => {
      // 3.2 — генерируем событие о входящем запросе
      this.emit('request:received', { method: req.method, url: req.url });

      // 3.4 — отвечаем текстом (сохранил и вашу страницу с ФИО)
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <h1>Информация о студенте</h1>
        <p><strong>ФИО:</strong> ${fullName}</p>
        <p><strong>Группа:</strong> ${group}</p>
        <p><strong>Число Пи (до ${journalNumber} знака):</strong> ${this.piRounded}</p>
        <hr>
        <p><strong>Hello from Event-Driven Server!</strong></p>
      `);
    });

    this.server.listen(port, () => {
      // 3.2 — генерируем событие запуска
      this.emit('server:started', port);
    });
  }

  stop() {
    if (this.server) {
      this.server.close(() => {
        // 3.2 — генерируем событие остановки
        this.emit('server:stopped');
      });
    }
  }
}

module.exports = AppServer;

// === Запуск (только если файл вызван напрямую) ===
if (require.main === module) {
  const app = new AppServer();

  // 3.3 — обработчики событий
  app.on('server:started', (port) => {
    console.log(`🚀 Сервер запущен на порту ${port}`);
  });

  app.on('request:received', ({ method, url }) => {
    console.log(`📥 Получен запрос: ${method} ${url}`);
  });

  app.on('server:stopped', () => {
    console.log('🛑 Сервер остановлен');
  });

  // 4.4 — подключаем логгер
  const logger = require('./logger');
  logger.setupLogger(app);

  // 3 — запуск и остановка через 10 секунд
  app.start(3000);

  setTimeout(() => {
    app.stop();
  }, 10000);
}