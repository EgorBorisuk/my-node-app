// task4-streams.js
// Task 4: generate big file + stream processing
// Variant 1 -> range 1-5 -> also count even/odd numbers

const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const readline = require('readline');

const VARIANT = 1;

const dataFile = path.join(__dirname, `data_${VARIANT}.txt`);
const processedFile = path.join(__dirname, `processed_${VARIANT}.txt`);

const TOTAL_LINES = 100000;

// 1) Generate file
async function generateFile() {
  try {
    await fsp.access(dataFile);
    console.log(`File already exists: data_${VARIANT}.txt`);
  } catch {
    console.log(`Generating data_${VARIANT}.txt (${TOTAL_LINES} lines)...`);
    const stream = fs.createWriteStream(dataFile, { encoding: 'utf8' });
    for (let i = 1; i <= TOTAL_LINES; i++) {
      const num = Math.floor(Math.random() * 1000) + 1;
      const line = `${i}, ${num}, Variant ${VARIANT}\n`;
      if (!stream.write(line)) {
        await new Promise((r) => stream.once('drain', r));
      }
    }
    await new Promise((r) => stream.end(r));
    console.log('File generated.');
  }
}

// 2) Process with streams
async function processFile() {
  const stat = await fsp.stat(dataFile);
  const sizeMB = (stat.size / 1024 / 1024).toFixed(2);
  console.log(`\nProcessing file: data_${VARIANT}.txt`);
  console.log(`File size: ${sizeMB} MB`);

  const start = Date.now();

  let count = 0;
  let sum = 0;
  let min = Infinity;
  let max = -Infinity;
  let even = 0;
  let odd = 0;

  // Stream read with 64 KB buffer
  const rl = readline.createInterface({
    input: fs.createReadStream(dataFile, { encoding: 'utf8', highWaterMark: 64 * 1024 }),
    crlfDelay: Infinity,
  });

  let lastPct = 0;
  for await (const line of rl) {
    const parts = line.split(',').map((s) => s.trim());
    const num = parseInt(parts[1], 10);
    if (isNaN(num)) continue;

    count++;
    sum += num;
    if (num < min) min = num;
    if (num > max) max = num;
    if (num % 2 === 0) even++; else odd++;

    const pct = Math.floor((count / TOTAL_LINES) * 100);
    if (pct >= lastPct + 10) {
      lastPct = Math.floor(pct / 10) * 10;
      console.log(`Progress: ${lastPct}% (${count.toLocaleString()} lines processed)`);
    }
  }

  const avg = sum / count;

  let report =
    `Total lines: ${count.toLocaleString()}\n` +
    `Sum of numbers: ${sum.toLocaleString()}\n` +
    `Average: ${avg.toFixed(2)}\n` +
    `Max number: ${max}\n` +
    `Min number: ${min}\n` +
    `Even numbers: ${even.toLocaleString()}\n` +
    `Odd numbers: ${odd.toLocaleString()}\n`;

  await fsp.writeFile(processedFile, report, 'utf8');

  console.log('Processing complete!');
  console.log('\nResults:');
  console.log(report);
  console.log(`Results saved to: processed_${VARIANT}.txt`);
  console.log(`Execution time: ${((Date.now() - start) / 1000).toFixed(2)} sec`);
}

async function main() {
  try {
    await generateFile();
    await processFile();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();