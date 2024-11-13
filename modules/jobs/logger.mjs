// logger.mjs
import fs from 'fs';
import path from 'path';
import { createLogger, format, transports } from 'winston';
const { combine, timestamp, printf } = format;

// Function to handle circular references
const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return "[Circular]";
      }
      seen.add(value);
    }
    return value;
  };
};

// Define the custom settings for each transport (file, console)
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata, getCircularReplacer(), 2)}`;
  }
  return msg;
});

// Get the current working directory
const cwd = process.cwd();
const absLogPath = path.join(cwd, 'app.log');

// Check if the file exists
fs.access(absLogPath, fs.constants.F_OK, (err) => {
  if (err) {
    console.log(`Log file doesn't exist at ${absLogPath}`);
  } else {
    console.log(`Log file is located at ${absLogPath}`);
  }
});

const logger = createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    logFormat
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: absLogPath })
  ]
});

export default logger;
