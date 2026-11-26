
const { initProject } = require('../services/projectService');
const logger = require('../utils/logger');

function runInit(projectName) {
    try {
        const result = initProject(projectName);
        logger.success(result);
    } catch (error) {
        throw error;
    }
}

module.exports = runInit;
