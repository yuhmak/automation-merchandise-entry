const fs = require('fs').promises;
const path = require('path');

const logFilePath = path.join(__dirname, '../../automation_hogar.log');

const logger = {
    info: async (message) => {
        const timestamp = new Date().toISOString();
        const formattedMessage = `[${timestamp}] [INFO] ${message}`;
        console.log(formattedMessage);
        await fs.appendFile(logFilePath, `${formattedMessage}\n`);
    },
    error: async (message, error) => {
        const timestamp = new Date().toISOString();
        const formattedMessage = `[${timestamp}] [ERROR] ${message} - ${error.message || error}`;
        console.error(formattedMessage);
        await fs.appendFile(logFilePath, `${formattedMessage}\n`);
    }
};

module.exports = logger;
