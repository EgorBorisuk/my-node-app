const fs = require('fs').promises;
const path = require('path');

const VARIANT = 1;
const isEven = VARIANT % 2 === 0;
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
    for (const d of dirs) {
      await fs.mkdir(path.join(root, d), { recursive: true });
    }
    console.log(`Structure created: project_${VARIANT}/`);

    for (const d of dirs) {
      const folderName = path.basename(d);
      await fs.writeFile(
        path.join(root, d, 'info.txt'),
        `Folder purpose: ${purposes[folderName] || folderName}\n`,
        'utf8'
      );
    }

    if (isEven) {
      const today = new Date().toISOString().slice(0, 10);
      for (const d of dirs) {
        await fs.writeFile(path.join(root, d, 'README.md'), `Date: ${today}\n`, 'utf8');
      }
    } else {
      for (let i = 1; i <= 3; i++) {
        await fs.mkdir(path.join(root, 'src', 'components', String(i)), { recursive: true });
      }
      console.log('Extra: created src/components/1,2,3');
    }

    console.log('\nTree before changes:');
    console.log(`project_${VARIANT}/`);
    await printTree(root);

    await fs.rename(path.join(root, 'temp'), path.join(root, 'data', 'temp'));
    await fs.rename(path.join(root, 'data', 'output'), path.join(root, 'data', 'results'));
    await fs.rm(path.join(root, 'data', 'temp'), { recursive: true, force: true });

    console.log('\nTree after changes:');
    console.log(`project_${VARIANT}/`);
    await printTree(root);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();