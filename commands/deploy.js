
const { deployProject } = require('../services/projectService');
const logger = require('../utils/logger');

function runDeploy(options) {
    try {
        const result = deployProject({
            force: options.force,
            dryRun: options.dryRun
        });

        logger.success(result);
    } catch (error) {
        throw error;
    }
}

module.exports = runDeploy;
