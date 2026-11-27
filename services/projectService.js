
const fs = require('fs');
const path = require('path');

function initProject(projectName) {
    if (!projectName) {
        throw new Error('Не указано имя проекта');
    }

    const projectPath = path.resolve(projectName);

    if (fs.existsSync(projectPath)) {
        throw new Error('Папка проекта уже существует');
    }

    fs.mkdirSync(path.join(projectPath, 'src'), {
        recursive: true
    });

    fs.writeFileSync(
        path.join(projectPath, 'README.md'),
        `# ${projectName}\n\nПроект создан с помощью My CLI.\n`
    );

    fs.writeFileSync(
        path.join(projectPath, 'src', 'index.js'),
        "console.log('Hello from My CLI!');\n"
    );

    return `Проект ${projectName} успешно создан`;
}

function buildProject(projectPath = '.') {
    const sourceFile = path.join(
        projectPath,
        'src',
        'index.js'
    );

    if (!fs.existsSync(sourceFile)) {
        throw new Error('Исходный файл src/index.js не найден');
    }

    const outputDirectory = path.join(projectPath, 'dist');

    fs.mkdirSync(outputDirectory, {
        recursive: true
    });

    const content = fs.readFileSync(sourceFile, 'utf8');

    fs.writeFileSync(
        path.join(outputDirectory, 'app.js'),
        content
    );

    return 'Сборка проекта успешно завершена';
}

function deployProject(options = {}) {
    if (options.dryRun) {
        return 'Проверка выполнена. Развёртывание не запускалось';
    }

    if (!options.force) {
        throw new Error(
            'Для подтверждения развёртывания используйте --force'
        );
    }

    return 'Проект успешно развёрнут';
}

module.exports = {
    initProject,
    buildProject,
    deployProject
};
