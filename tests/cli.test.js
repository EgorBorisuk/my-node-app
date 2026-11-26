
const test = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const cliPath = path.resolve(__dirname, '../bin/cli.js');

function runCLI(args, options = {}) {
    return spawnSync(
        process.execPath,
        [cliPath, ...args],
        {
            encoding: 'utf8',
            ...options
        }
    );
}

test('CLI показывает версию', () => {
    const result = runCLI(['--version']);

    assert.strictEqual(result.status, 0);
    assert.ok(result.stdout.includes('1.0.0'));
});

test('CLI показывает справку', () => {
    const result = runCLI(['--help']);

    assert.strictEqual(result.status, 0);
    assert.ok(result.stdout.includes('init'));
    assert.ok(result.stdout.includes('build'));
    assert.ok(result.stdout.includes('deploy'));
});

test('CLI создаёт проект', () => {
    const tempPath = fs.mkdtempSync(
        path.join(os.tmpdir(), 'mycli-test-')
    );

    try {
        const result = runCLI(
            ['init', 'demo-project'],
            { cwd: tempPath }
        );

        assert.strictEqual(result.status, 0);

        assert.ok(
            fs.existsSync(
                path.join(
                    tempPath,
                    'demo-project',
                    'src',
                    'index.js'
                )
            )
        );
    } finally {
        fs.rmSync(tempPath, {
            recursive: true,
            force: true
        });
    }
});

test('CLI возвращает ошибку при неправильном развёртывании', () => {
    const result = runCLI(['deploy']);

    assert.strictEqual(result.status, 1);
    assert.ok(result.stderr.includes('--force'));
});
