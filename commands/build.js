
const { buildProject } = require('../services/projectService');
const logger = require('../utils/logger');

function runBuild(options) {
    try {
        const result = buildProject(options.path || '.');
        logger.success(result);
    } catch (error) {
        throw error;
    }
}

module.exports = runBuild;
