// task2-directories.js
// Task 2: create directory structure, move, rename and delete folders

const fs = require('fs').promises;
const path = require('path');

const VARIANT = 5; // ← CHANGE to your variant number
const isEven = VARIANT % 2 === 0; // is variant even?

const root = path.join(__dirname, `project_${VARIANT}`);

// All directories to create
const dirs = [
  'src/modules',
  'src/components',
  'src/utils',
  'data/input',
  'data/output',
  'temp',
];

// Purpose of each folder (for info.txt)
const purposes = {
  src: 'Project source code',
  modules: 'Application modules',
  components: 'UI components',
  utils: 'Helper utilities',
  data: 'Project data',
  input: 'Input data',
  output: 'Output data',
  temp: 'Temporary files',
};

// Recursive tree printer
async function printTree(dir, prefix = '') {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const last = i === entries.length - 1;
    console.log(`${prefix}${last ? '└── ' : '├── '}${e.name}`);
    if (e.isDirectory()) {
      await printTree(path.join(dir, e.name), prefix + (last ? '    ' : '│   '));
    }
  }
}

async function main() {
  try {
    // 1) Create directory structure
    for (const d of dirs) {
      await fs.mkdir(path.join(root, d), { recursive: true });
    }
    console.log(`Structure created: project_${VARIANT}/`);

    // 2) info.txt in each folder
    for (const d of dirs) {
      const folderName = path.basename(d);
      await fs.writeFile(
        path.join(root, d, 'info.txt'),
        `Folder purpose: ${purposes[folderName] || folderName}\n`,
        'utf8'
      );
    }

    // 2b) Extra condition by variant
    if (isEven) {
      // even variant: README.md with date in each folder
      const today = new Date().toISOString().slice(0, 10);
      for (const d of dirs) {
        await fs.writeFile(path.join(root, d, 'README.md'), `Date: ${today}\n`, 'utf8');
      }
    } else {
      // odd variant: 3 nested folders 1..3 in src/components
      for (let i = 1; i <= 3; i++) {
        await fs.mkdir(path.join(root, 'src', 'components', String(i)), { recursive: true });
      }
    }

    // 3) Tree before changes
    console.log('\nTree before changes:');
    console.log(`project_${VARIANT}/`);
    await printTree(root);

    // 4) Move temp into data
    await fs.rename(path.join(root, 'temp'), path.join(root, 'data', 'temp'));

    // 5) Rename data/output → data/results
    await fs.rename(path.join(root, 'data', 'output'), path.join(root, 'data', 'results'));

    // 6) Delete data/temp with contents
    await fs.rm(path.join(root, 'data', 'temp'), { recursive: true, force: true });

    // 7) Tree after changes
    console.log('\nTree after changes:');
    console.log(`project_${VARIANT}/`);
    await printTree(root);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();