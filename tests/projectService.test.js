
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const {
    initProject,
    buildProject,
    deployProject
} = require('../services/projectService');

test('Создание нового проекта', () => {
    const tempPath = fs.mkdtempSync(
        path.join(os.tmpdir(), 'mycli-')
    );

    const oldDirectory = process.cwd();

    try {
        process.chdir(tempPath);

        const result = initProject('test-project');

        assert.ok(result.includes('успешно создан'));
        assert.ok(
            fs.existsSync('test-project/src/index.js')
        );
        assert.ok(
            fs.existsSync('test-project/README.md')
        );
    } finally {
        process.chdir(oldDirectory);
        fs.rmSync(tempPath, {
            recursive: true,
            force: true
        });
    }
});

test('Сборка проекта', () => {
    const tempPath = fs.mkdtempSync(
        path.join(os.tmpdir(), 'mycli-')
    );

    try {
        fs.mkdirSync(path.join(tempPath, 'src'));

        fs.writeFileSync(
            path.join(tempPath, 'src', 'index.js'),
            "console.log('Test');"
        );

        const result = buildProject(tempPath);

        assert.ok(result.includes('успешно завершена'));

        assert.ok(
            fs.existsSync(
                path.join(tempPath, 'dist', 'app.js')
            )
        );
    } finally {
        fs.rmSync(tempPath, {
            recursive: true,
            force: true
        });
    }
});

test('Развёртывание без подтверждения должно завершиться ошибкой', () => {
    assert.throws(
        () => deployProject({}),
        /--force/
    );
});

test('Проверка режима dry-run', () => {
    const result = deployProject({
        dryRun: true
    });

    assert.ok(result.includes('не запускалось'));
});
