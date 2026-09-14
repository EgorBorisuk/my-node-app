const fs = require('fs');
const path = require('path');
const util = require('util');

// Промис-обёртки
const writeFileAsync = util.promisify(fs.writeFile);
const readFileAsync = util.promisify(fs.readFile);
const unlinkAsync = util.promisify(fs.unlink);
const readdirAsync = util.promisify(fs.readdir);
const statAsync = util.promisify(fs.stat);

/**
 * Гибридный менеджер файлов:
 * - если передан callback — работает как колбэк
 * - если callback не передан — возвращает Promise
 */
class HybridFileManager {
    constructor(baseDir = './data-hybrid') {
        this.baseDir = baseDir;
        if (!fs.existsSync(baseDir)) {
            fs.mkdirSync(baseDir, { recursive: true });
            console.log(`Создана директория: ${baseDir}`);
        }
    }

    /**
     * Создание файла (гибрид)
     */
    createFile(filename, content, callback) {
        const filePath = path.join(this.baseDir, filename);

        if (typeof callback === 'function') {
            // Режим колбэка
            fs.writeFile(filePath, content, 'utf8', (err) => {
                if (err) return callback(err, null);
                callback(null, filePath);
            });
        } else {
            // Режим промиса
            return writeFileAsync(filePath, content, 'utf8')
                .then(() => filePath);
        }
    }

    /**
     * Чтение файла (гибрид)
     */
    readFile(filename, callback) {
        const filePath = path.join(this.baseDir, filename);

        if (typeof callback === 'function') {
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) return callback(err, null);
                callback(null, data);
            });
        } else {
            return readFileAsync(filePath, 'utf8');
        }
    }

    /**
     * Получение статистики (гибрид)
     */
    getFileStats(filename, callback) {
        const filePath = path.join(this.baseDir, filename);

        if (typeof callback === 'function') {
            fs.stat(filePath, (err, stats) => {
                if (err) return callback(err, null);
                callback(null, {
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime,
                    isFile: stats.isFile()
                });
            });
        } else {
            return statAsync(filePath).then(stats => ({
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                isFile: stats.isFile()
            }));
        }
    }

    /**
     * Удаление файла (гибрид)
     */
    deleteFile(filename, callback) {
        const filePath = path.join(this.baseDir, filename);

        if (typeof callback === 'function') {
            fs.unlink(filePath, (err) => {
                if (err) return callback(err);
                callback(null);
            });
        } else {
            return unlinkAsync(filePath);
        }
    }

    /**
     * Список файлов (гибрид)
     */
    listFiles(callback) {
        if (typeof callback === 'function') {
            fs.readdir(this.baseDir, (err, files) => {
                if (err) return callback(err, null);

                const promises = files.map(file => {
                    return new Promise((resolve) => {
                        const filePath = path.join(this.baseDir, file);
                        fs.stat(filePath, (err, stats) => {
                            resolve({ name: file, isFile: !err && stats.isFile() });
                        });
                    });
                });

                Promise.all(promises)
                    .then(results => {
                        const onlyFiles = results
                            .filter(r => r.isFile)
                            .map(r => r.name);
                        callback(null, onlyFiles);
                    })
                    .catch(err => callback(err, null));
            });
        } else {
            return readdirAsync(this.baseDir).then(files =>
                Promise.all(
                    files.map(async (file) => {
                        const filePath = path.join(this.baseDir, file);
                        const stats = await statAsync(filePath);
                        return { name: file, isFile: stats.isFile() };
                    })
                ).then(results =>
                    results.filter(r => r.isFile).map(r => r.name)
                )
            );
        }
    }
}

// ЭКСПОРТ КЛАССА
module.exports = HybridFileManager;