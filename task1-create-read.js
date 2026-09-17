// task1-create-read.js
// Task 1: create, write, append and read student_1.txt
// Variant: 1 (Borisuk Egor)

const fs = require('fs').promises; // only async methods (fs.promises)
const path = require('path');      // path module for all paths

const VARIANT = 1; // journal number

// Path relative to current directory
const fileName = `student_${VARIANT}.txt`;
const filePath = path.join(__dirname, fileName);

// Student data
const student = {
  name: 'Borisuk Egor Aleksandrovich',
  group: '401',
  variant: VARIANT,
  date: new Date().toISOString().replace('T', ' ').slice(0, 19),
  books: [
    'War and Peace - L. Tolstoy',
    'Crime and Punishment - F. Dostoevsky',
    'The Master and Margarita - M. Bulgakov',
    '1984 - G. Orwell',
    'Harry Potter - J. Rowling',
  ],
};

async function main() {
  try {
    // 1) Build file content
    let content =
      `Student: ${student.name}\n` +
      `Group: ${student.group}\n` +
      `Variant: ${student.variant}\n` +
      `Date: ${student.date}\n` +
      `Favorite books:\n` +
      student.books.map((b, i) => `${i + 1}. ${b}`).join('\n') +
      '\n';

    // 2) Write file (overwrite)
    await fs.writeFile(filePath, content, 'utf8');
    console.log(`File created: ${fileName}`);

    // 3) Count lines and append summary
    const lines = content.split('\n').filter((l) => l.trim() !== '').length;
    await fs.appendFile(filePath, `Total records: ${lines}\n`, 'utf8');

    // 4) Read and print
    const data = await fs.readFile(filePath, 'utf8');
    const sep = '─'.repeat(33);
    console.log('File content:');
    console.log(sep);
    console.log(data.trimEnd());
    console.log(sep);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();