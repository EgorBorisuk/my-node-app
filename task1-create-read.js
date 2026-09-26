// task1-create-read.js
<<<<<<< HEAD
// Task 1: create, write, append and read student_N.txt
=======
// Task 1: create, write, append and read student_1.txt
// Variant: 1 (Borisuk Egor)
>>>>>>> dd194fb2bcafc72c94a4455d3ebef9d3130ca8a5

const fs = require('fs').promises; // only async methods (fs.promises)
const path = require('path');      // path module for all paths

<<<<<<< HEAD
const VARIANT = 5; // ← CHANGE to your variant number

// Build path relative to current directory
=======
const VARIANT = 1; // journal number

// Path relative to current directory
>>>>>>> dd194fb2bcafc72c94a4455d3ebef9d3130ca8a5
const fileName = `student_${VARIANT}.txt`;
const filePath = path.join(__dirname, fileName);

// Student data
const student = {
<<<<<<< HEAD
  name: 'Ivanov Ivan',
  group: 'IS-202',
=======
  name: 'Borisuk Egor Aleksandrovich',
  group: '401',
>>>>>>> dd194fb2bcafc72c94a4455d3ebef9d3130ca8a5
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

<<<<<<< HEAD
    // 3) Count lines and append summary line
    const lines = content.split('\n').filter((l) => l.trim() !== '').length;
    await fs.appendFile(filePath, `Total records: ${lines}\n`, 'utf8');

    // 4) Read file and print formatted
=======
    // 3) Count lines and append summary
    const lines = content.split('\n').filter((l) => l.trim() !== '').length;
    await fs.appendFile(filePath, `Total records: ${lines}\n`, 'utf8');

    // 4) Read and print
>>>>>>> dd194fb2bcafc72c94a4455d3ebef9d3130ca8a5
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