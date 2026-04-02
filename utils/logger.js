const winston = require("winston");
const path = require("path");

/**
 * Enterprise-grade logging utility
 * Supports structured JSON logging with multiple transports
 */

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const LOG_COLORS = {
  error: "red",
  warn: "yellow",
  info: "green",
  debug: "blue"
};

winston.addColors(LOG_COLORS);

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : "";
    return `[${timestamp}] ${level}: ${message} ${metaStr}`;
  })
);

// JSON format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  levels: LOG_LEVELS,
  level: process.env.LOG_LEVEL || "info",
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat
    }),
    // Error log file
    new winston.transports.File({
      filename: path.join(__dirname, "../logs/error.log"),
      level: "error",
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Combined log file
    new winston.transports.File({
      filename: path.join(__dirname, "../logs/combined.log"),
      format: fileFormat,
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

// Export convenience methods
module.exports = {
  info: (message, meta = {}) => logger.info(message, meta),
  warn: (message, meta = {}) => logger.warn(message, meta),
  error: (message, meta = {}) => logger.error(message, meta),
  debug: (message, meta = {}) => logger.debug(message, meta),
  logger
};
