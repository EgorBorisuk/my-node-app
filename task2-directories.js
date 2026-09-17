// task2-directories.js
// Task 2: create directory structure, move, rename, delete
// Variant 1 -> ODD -> create 3 nested folders in src/components

const fs = require('fs').promises;
const path = require('path');

const VARIANT = 1;
const isEven = VARIANT % 2 === 0; // false for variant 1

const root = path.join(__dirname, `project_${VARIANT}`);

const dirs = [
  'src/modules',
  'src/components',
  'src/utils',
  'data/input',
  'data/output',
  'temp',
];

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
    // 1) Create dirs
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

    // 2b) Extra condition
    if (isEven) {
      // even variant: README.md with date
      const today = new Date().toISOString().slice(0, 10);
      for (const d of dirs) {
        await fs.writeFile(path.join(root, d, 'README.md'), `Date: ${today}\n`, 'utf8');
      }
    } else {
      // ODD variant (yours): 3 nested folders 1..3 in src/components
      for (let i = 1; i <= 3; i++) {
        await fs.mkdir(path.join(root, 'src', 'components', String(i)), { recursive: true });
      }
      console.log('Extra: created src/components/1,2,3');
    }

    // 3) Tree before
    console.log('\nTree before changes:');
    console.log(`project_${VARIANT}/`);
    await printTree(root);

    // 4) Move temp into data
    await fs.rename(path.join(root, 'temp'), path.join(root, 'data', 'temp'));

    // 5) Rename data/output → data/results
    await fs.rename(path.join(root, 'data', 'output'), path.join(root, 'data', 'results'));

    // 6) Delete data/temp
    await fs.rm(path.join(root, 'data', 'temp'), { recursive: true, force: true });

    // 7) Tree after
    console.log('\nTree after changes:');
    console.log(`project_${VARIANT}/`);
    await printTree(root);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();