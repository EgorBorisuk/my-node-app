// task4-streams.js
// Task 4: generate large file and process it with streams

const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const readline = require('readline');

const VARIANT = 5; // ← CHANGE to your variant number

const dataFile = path.join(__dirname, `data_${VARIANT}.txt`);
const processedFile = path.join(__dirname, `processed_${VARIANT}.txt`);
const filteredFile = path.join(__dirname, `filtered_${VARIANT}.txt`); // variants 11-15

const TOTAL_LINES = 100000;

// 1) Generate file via stream (if not exists)
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

// 2) Process file with streams
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
  const freq = new Map();   // for variants 6-10
  const numbers = [];       // for median (variants 16-20)
  const filterStream = fs.createWriteStream(filteredFile, { encoding: 'utf8' }); // 11-15

  // Stream read with 64 KB buffer (highWaterMark)
  const rl = readline.createInterface({
    input: fs.createReadStream(dataFile, { encoding: 'utf8', highWaterMark: 64 * 1024 }),
    crlfDelay: Infinity,
  });

  let lastPct = 0;
  for await (const line of rl) {
    // Line format: "1, 847, Variant 5"
    const parts = line.split(',').map((s) => s.trim());
    const num = parseInt(parts[1], 10);
    if (isNaN(num)) continue;

    count++;
    sum += num;
    if (num < min) min = num;
    if (num > max) max = num;
    if (num % 2 === 0) even++; else odd++;

    freq.set(num, (freq.get(num) || 0) + 1);
    numbers.push(num);
    if (num > 500) filterStream.write(line + '\n'); // 11-15

    // Progress every 10%
    const pct = Math.floor((count / TOTAL_LINES) * 100);
    if (pct >= lastPct + 10) {
      lastPct = Math.floor(pct / 10) * 10;
      console.log(`Progress: ${lastPct}% (${count.toLocaleString()} lines processed)`);
    }
  }
  filterStream.end();

  const avg = sum / count;

  // Build report
  let report =
    `Total lines: ${count.toLocaleString()}\n` +
    `Sum of numbers: ${sum.toLocaleString()}\n` +
    `Average: ${avg.toFixed(2)}\n` +
    `Max number: ${max}\n` +
    `Min number: ${min}\n` +
    `Even numbers: ${even.toLocaleString()}\n` +
    `Odd numbers: ${odd.toLocaleString()}\n`;

  // Extra conditions by variant
  if (VARIANT >= 6 && VARIANT <= 10) {
    const top10 = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    report += `\nTop-10 most frequent numbers:\n` + top10.map(([n, c]) => `  ${n}: ${c} times`).join('\n') + '\n';
  }
  if (VARIANT >= 16 && VARIANT <= 20) {
    numbers.sort((a, b) => a - b);
    const mid = Math.floor(numbers.length / 2);
    const median =
      numbers.length % 2 === 0 ? (numbers[mid - 1] + numbers[mid]) / 2 : numbers[mid];
    report += `\nMedian: ${median}\n`;
  }

  await fsp.writeFile(processedFile, report, 'utf8');

  console.log('Processing complete!');
  console.log('\nResults:');
  console.log(report);
  console.log(`Results saved to: processed_${VARIANT}.txt`);
  if (VARIANT >= 11 && VARIANT <= 15) {
    console.log(`Lines with numbers > 500 saved to: filtered_${VARIANT}.txt`);
  }
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