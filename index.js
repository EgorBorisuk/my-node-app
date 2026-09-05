const http = require('http');

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


const pi = calculatePi(1000000);
const piRounded = pi.toFixed(journalNumber);

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`
    <h1>Информация о студенте</h1>
    <p><strong>ФИО:</strong> ${fullName}</p>
    <p><strong>Группа:</strong> ${group}</p>
    <p><strong>Число Пи (до ${journalNumber} знака):</strong> ${piRounded}</p>
  `);
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});