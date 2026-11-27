
const chalk = require('chalk');

function success(message) {
    console.log(chalk.green('✔ ' + message));
}

function error(message) {
    console.error(chalk.red('✖ ' + message));
}

function warning(message) {
    console.error(chalk.yellow('⚠ ' + message));
}

function info(message) {
    console.log(chalk.blue('ℹ ' + message));
}

module.exports = {
    success,
    error,
    warning,
    info
};
