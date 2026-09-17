// task3-search.js
// Task 3: recursive directory scan + report_1.json
// Variant 1 -> range 1-5 -> skip files larger than 10 MB

const fs = require('fs').promises;
const path = require('path');

const VARIANT = 1;
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB — variants 1-5

const targetDir = process.argv[2] ? path.resolve(process.argv[2]) : __dirname;

// For variants 6-10 this would skip node_modules/.git
const IGNORE_DIRS = new Set(['node_modules', '.git']);

const stats = {
  files: 0,
  dirs: 0,
  totalSize: 0,
  byExt: {},
  allFiles: [],
};

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function scan(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    // For variants 1-5 we only ignore node_modules/.git inside them
    if (e.isDirectory() && IGNORE_DIRS.has(e.name)) continue;

    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      stats.dirs++;
      await scan(full);
    } else {
      const stat = await fs.stat(full);

      // Variant 1-5: skip files > 10 MB
      if (stat.size > MAX_SIZE) continue;

      stats.files++;
      stats.totalSize += stat.size;

      const ext = path.extname(e.name) || '(no extension)';
      if (!stats.byExt[ext]) stats.byExt[ext] = { count: 0, size: 0 };
      stats.byExt[ext].count++;
      stats.byExt[ext].size += stat.size;

      stats.allFiles.push({
        name: e.name,
        size: stat.size,
        path: path.relative(__dirname, full),
      });
    }
  }
}

async function main() {
  try {
    await scan(targetDir);

    console.log(`Analyzing directory: ${targetDir}`);
    console.log(`Total folders: ${stats.dirs}`);
    console.log(`Total files: ${stats.files}`);
    console.log(
      `Total size: ${formatSize(stats.totalSize)} (${stats.totalSize.toLocaleString()} bytes)`
    );

    console.log('\nFile extensions:');
    for (const [ext, v] of Object.entries(stats.byExt).sort((a, b) => b[1].size - a[1].size)) {
      console.log(`  ${ext}: ${v.count} file(s) (${formatSize(v.size)})`);
    }

    const sorted = [...stats.allFiles].sort((a, b) => b.size - a.size);
    console.log('\nTop-5 largest files:');
    sorted.slice(0, 5).forEach((f, i) =>
      console.log(`  ${i + 1}. ${f.name} (${formatSize(f.size)}) - ./${f.path}`)
    );

    console.log('\nTop-5 smallest files:');
    [...sorted].reverse().slice(0, 5).forEach((f, i) =>
      console.log(`  ${i + 1}. ${f.name} (${formatSize(f.size)}) - ./${f.path}`)
    );

    const reportPath = path.join(__dirname, `report_${VARIANT}.json`);
    await fs.writeFile(reportPath, JSON.stringify(stats, null, 2), 'utf8');
    console.log(`\nReport saved: report_${VARIANT}.json`);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();