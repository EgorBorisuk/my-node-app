const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'logs.txt');

function writeLog(event, data) {
  const time = new Date().toISOString();
  const line = `[${time}] ${event}: ${JSON.stringify(data)}\n`;

  // 4.3 — асинхронная запись
  fs.appendFile(LOG_FILE, line, (err) => {
    if (err) console.error('Ошибка записи в лог:', err);
  });
}

function setupLogger(app) {
  app.on('server:started', (port) => writeLog('server:started', { port }));
  app.on('server:stopped', () => writeLog('server:stopped', {}));
  app.on('request:received', (req) => writeLog('request:received', req));
}

module.exports = { setupLogger };