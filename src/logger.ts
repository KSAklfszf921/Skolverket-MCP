/**
 * Strukturerad logging för Skolverket MCP Server
 * VIKTIGT: Använder endast stderr, ALDRIG stdout (MCP-krav)
 */

import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log level från miljövariabel eller default till 'info'
const logLevel = process.env.LOG_LEVEL || 'info';

// Log directory - använd miljövariabel eller default till projektets root/logs
const getLogDir = () => {
  if (process.env.LOG_DIR) {
    return process.env.LOG_DIR;
  }
  // Use project root (two levels up from src/ directory)
  return path.join(__dirname, '..', 'logs');
};

// Skapa logger
export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'skolverket-mcp',
    version: '2.1.3'
  },
  transports: [
    // Error log - endast errors
    new winston.transports.File({
      filename: path.join(getLogDir(), 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Combined log - alla nivåer
    new winston.transports.File({
      filename: path.join(getLogDir(), 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Console output - ENDAST till stderr
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          let msg = `${timestamp} [${level}]: ${message}`;
          if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
          }
          return msg;
        })
      ),
      stderrLevels: ['error', 'warn', 'info', 'debug'], // ALLT till stderr
    })
  ],
  // Hantera uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(getLogDir(), 'exceptions.log')
    })
  ],
  // Hantera unhandled rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(getLogDir(), 'rejections.log')
    })
  ]
});

// Skapa logs-mappen om den inte finns
import fs from 'fs';
const logsDir = getLogDir();
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Export hjälpfunktioner med optional request ID
export const log = {
  error: (message: string, meta?: any) => logger.error(message, meta),
  warn: (message: string, meta?: any) => logger.warn(message, meta),
  info: (message: string, meta?: any) => logger.info(message, meta),
  debug: (message: string, meta?: any) => logger.debug(message, meta),
};

// Hjälpfunktion för att skapa logg med request ID
export function createRequestLogger(requestId: string) {
  return {
    error: (message: string, meta?: any) => logger.error(message, { ...meta, requestId }),
    warn: (message: string, meta?: any) => logger.warn(message, { ...meta, requestId }),
    info: (message: string, meta?: any) => logger.info(message, { ...meta, requestId }),
    debug: (message: string, meta?: any) => logger.debug(message, { ...meta, requestId }),
  };
}

export default logger;
