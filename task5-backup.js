// task5-backup.js
<<<<<<< HEAD
// Task 5: backup via streams + directory sync
=======
// Task 5: backup via streams + sync
// Variant 1 -> range 1-5 -> compress text files (remove extra spaces)
>>>>>>> dd194fb2bcafc72c94a4455d3ebef9d3130ca8a5

const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');

<<<<<<< HEAD
const VARIANT = 5; // ← CHANGE to your variant number
const sourceDir = path.join(__dirname, `source_${VARIANT}`);
const backupDir = path.join(__dirname, `backup_${VARIANT}`);

const EXT_STREAM = new Set(['.txt', '.js', '.json']); // via streams
const EXT_NORMAL = new Set(['.jpg', '.png', '.gif']); // normal copy
const CHUNK_SIZE = 512 * 1024; // 512 KB
=======
const VARIANT = 1;
const sourceDir = path.join(__dirname, `source_${VARIANT}`);
const backupDir = path.join(__dirname, `backup_${VARIANT}`);

const EXT_STREAM = new Set(['.txt', '.js', '.json']);
const TEXT_EXT = new Set(['.txt', '.js', '.json', '.md', '.css']); // for compression (variant 1-5)
const CHUNK_SIZE = 512 * 1024;
>>>>>>> dd194fb2bcafc72c94a4455d3ebef9d3130ca8a5

// ---- 1) Create test structure ----
async function createSource() {
  await fsp.rm(sourceDir, { recursive: true, force: true });
  await fsp.mkdir(sourceDir, { recursive: true });

  const extensions = ['.txt', '.js', '.json', '.jpg', '.png', '.gif', '.md', '.css'];
  const manifest = [];

<<<<<<< HEAD
  // 20 files in root
  for (let i = 1; i <= 20; i++) {
    const ext = extensions[i % extensions.length];
    const name = `file_${i}${ext}`;
    const size = Math.floor(Math.random() * 500) * 1024; // up to ~500 KB
    await fsp.writeFile(path.join(sourceDir, name), Buffer.alloc(size, `data ${i} `));
    manifest.push({ name, size });
  }

  // 3 subfolders with files
=======
  for (let i = 1; i <= 20; i++) {
    const ext = extensions[i % extensions.length];
    const name = `file_${i}${ext}`;
    const size = Math.floor(Math.random() * 500) * 1024;
    // Add spaces so compression has something to remove
    const content = Buffer.alloc(size, `  data ${i}   with   spaces  `);
    await fsp.writeFile(path.join(sourceDir, name), content);
    manifest.push({ name, size });
  }

>>>>>>> dd194fb2bcafc72c94a4455d3ebef9d3130ca8a5
  for (let d = 1; d <= 3; d++) {
    const sub = path.join(sourceDir, `sub_${d}`);
    await fsp.mkdir(sub, { recursive: true });
    for (let f = 1; f <= 3; f++) {
      const name = `nested_${f}.txt`;
<<<<<<< HEAD
      await fsp.writeFile(path.join(sub, name), `Subfolder ${d}, file ${f}\n`);
=======
      await fsp.writeFile(path.join(sub, name), `  Subfolder ${d},   file ${f}  \n`);
>>>>>>> dd194fb2bcafc72c94a4455d3ebef9d3130ca8a5
      manifest.push({ name: `sub_${d}/${name}`, size: 40 });
    }
  }

<<<<<<< HEAD
  // One big file (> 1 MB) — to test chunks
=======
  // Big file > 1 MB
>>>>>>> dd194fb2bcafc72c94a4455d3ebef9d3130ca8a5
  await fsp.writeFile(path.join(sourceDir, 'big.txt'), Buffer.alloc(2 * 1024 * 1024, 'x'));
  manifest.push({ name: 'big.txt', size: 2 * 1024 * 1024 });

  await fsp.writeFile(
    path.join(sourceDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf8'
  );
  console.log(`Created source_${VARIANT} (${manifest.length} files)`);
}

<<<<<<< HEAD
// ---- 2) Stream copy ----
=======
// ---- 2) Copy functions ----
>>>>>>> dd194fb2bcafc72c94a4455d3ebef9d3130ca8a5
function streamCopy(src, dest) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(src, { highWaterMark: 64 * 1024 })
      .pipe(fs.createWriteStream(dest))
      .on('finish', resolve)
      .on('error', reject);
  });
}

<<<<<<< HEAD
// Copy file > 1 MB in chunks of 512 KB
=======
// Copy with compression (remove extra spaces) — variant 1-5
function streamCopyCompressed(src, dest) {
  return new Promise((resolve, reject) => {
    const rl = require('readline').createInterface({
      input: fs.createReadStream(src, { encoding: 'utf8', highWaterMark: 64 * 1024 }),
    });
    const out = fs.createWriteStream(dest, { encoding: 'utf8' });
    rl.on('line', (line) => {
      // collapse multiple spaces into one and trim edges
      out.write(line.replace(/\s+/g, ' ').trim() + '\n');
    });
    rl.on('close', () => out.end());
    rl.on('error', reject);
    out.on('error', reject);
    out.on('finish', resolve);
  });
}

// Copy in chunks of 512 KB
>>>>>>> dd194fb2bcafc72c94a4455d3ebef9d3130ca8a5
async function chunkedCopy(src, dest) {
  const fd = await fsp.open(src, 'r');
  const out = fs.createWriteStream(dest);
  const buffer = Buffer.alloc(CHUNK_SIZE);
  let pos = 0;
  try {
    while (true) {
      const { bytesRead } = await fd.read(buffer, 0, CHUNK_SIZE, pos);
      if (bytesRead === 0) break;
      out.write(buffer.subarray(0, bytesRead));
      pos += bytesRead;
    }
    await new Promise((r) => out.end(r));
  } finally {
    await fd.close();
  }
}

async function copyDir(src, dest, stats) {
  await fsp.mkdir(dest, { recursive: true });
  const entries = await fsp.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) {
      await copyDir(s, d, stats);
    } else {
      const stat = await fsp.stat(s);
      const ext = path.extname(e.name).toLowerCase();
<<<<<<< HEAD
=======

>>>>>>> dd194fb2bcafc72c94a4455d3ebef9d3130ca8a5
      if (stat.size > 1024 * 1024) {
        await chunkedCopy(s, d); // chunks
        stats.chunked++;
      } else if (EXT_STREAM.has(ext)) {
<<<<<<< HEAD
        await streamCopy(s, d);  // stream
        stats.stream++;
      } else {
        await fsp.copyFile(s, d); // normal copy
=======
        // Variant 1-5: compress text-ish files while streaming
        if (TEXT_EXT.has(ext)) {
          await streamCopyCompressed(s, d);
          stats.compressed++;
        } else {
          await streamCopy(s, d);
        }
        stats.stream++;
      } else {
        await fsp.copyFile(s, d);
>>>>>>> dd194fb2bcafc72c94a4455d3ebef9d3130ca8a5
        stats.normal++;
      }
      stats.total++;
      stats.bytes += stat.size;
      console.log(`Progress: ${stats.total} files`);
    }
  }
}

// ---- 3) Sync ----
async function listFiles(dir, base = dir, out = {}) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    const rel = path.relative(base, full);
    if (e.isDirectory()) await listFiles(full, base, out);
    else {
      const stat = await fsp.stat(full);
      out[rel] = { size: stat.size, mtime: stat.mtimeMs };
    }
  }
  return out;
}

async function compareDirs() {
  const a = await listFiles(sourceDir);
  const b = await listFiles(backupDir);
  const same = [], changed = [], added = [], removed = [];

  for (const [rel, s] of Object.entries(a)) {
    if (!b[rel]) removed.push(rel);
<<<<<<< HEAD
    else if (b[rel].size !== s.size || Math.abs(b[rel].mtime - s.mtime) > 1) changed.push(rel);
=======
    // размер может отличаться из-за сжатия текста — учитываем это
    else if (b[rel].size !== s.size) changed.push(rel);
>>>>>>> dd194fb2bcafc72c94a4455d3ebef9d3130ca8a5
    else same.push(rel);
  }
  for (const rel of Object.keys(b)) {
    if (!a[rel]) added.push(rel);
  }

  const report =
    `Directory comparison:\n` +
    `  Same: ${same.length} files\n` +
<<<<<<< HEAD
    `  Changed: ${changed.length} files\n` +
=======
    `  Changed (size diff, e.g. compressed): ${changed.length} files\n` +
>>>>>>> dd194fb2bcafc72c94a4455d3ebef9d3130ca8a5
    `  Added: ${added.length} files\n` +
    `  Removed: ${removed.length} files\n`;

  console.log(report);
  const reportPath = path.join(__dirname, `sync_report_${VARIANT}.txt`);
  await fsp.writeFile(reportPath, report, 'utf8');
  console.log(`Report saved: sync_report_${VARIANT}.txt`);
}

async function main() {
  try {
    const start = Date.now();
    await createSource();

    await fsp.rm(backupDir, { recursive: true, force: true });
    await fsp.mkdir(backupDir, { recursive: true });

<<<<<<< HEAD
    const stats = { total: 0, stream: 0, normal: 0, chunked: 0, bytes: 0 };
=======
    const stats = { total: 0, stream: 0, normal: 0, chunked: 0, compressed: 0, bytes: 0 };
>>>>>>> dd194fb2bcafc72c94a4455d3ebef9d3130ca8a5
    await copyDir(sourceDir, backupDir, stats);

    console.log('\nCopy complete!');
    console.log(`  Files copied: ${stats.total}`);
    console.log(`  Stream copy: ${stats.stream}`);
<<<<<<< HEAD
=======
    console.log(`  Compressed (variant 1-5): ${stats.compressed}`);
>>>>>>> dd194fb2bcafc72c94a4455d3ebef9d3130ca8a5
    console.log(`  Normal copy: ${stats.normal}`);
    console.log(`  Chunked (>1 MB): ${stats.chunked}`);
    console.log(`  Total size: ${(stats.bytes / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Time: ${((Date.now() - start) / 1000).toFixed(2)} sec`);

    await compareDirs();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();