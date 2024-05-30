// logger.js
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, errors } = format;

// Custom format for the logs
const myFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
});

// Create a Winston logger instance
const logger = createLogger({
    level: 'info', // Log level can be adjusted ('info', 'warn', 'error', etc.)
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }), // Log stack traces for errors
        myFormat
    ),
    transports: [
        new transports.Console(), // Log to console
        new transports.File({ filename: 'logs/app.log' }) // Log to a file
    ]
});

module.exports = logger;
