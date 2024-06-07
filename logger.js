// logger.js
const fs = require('fs');
const path = require('path');
const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');
const { combine, timestamp, printf, errors } = format;

// Ensure log directory exists
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// Custom format for the logs
const myFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
});

// Create a Winston logger instance
const logger = createLogger({
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug', // Adjust log level based on the environment
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }), // Log stack traces for errors
        myFormat
    ),
    transports: [
        new transports.Console(), // Log to console
        new transports.DailyRotateFile({
            filename: 'logs/app-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d'
        })
    ]
});

// Add transport for logging to external services in production environment
if (process.env.NODE_ENV === 'production') {
    logger.add(new transports.Http({ host: 'log-server', port: 9000 }));
}

module.exports = logger;
