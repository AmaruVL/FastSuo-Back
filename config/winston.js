const winston = require("winston");
require("winston-daily-rotate-file");

const { combine, timestamp, label, printf } = winston.format;

const formato = printf(
  info =>
    `${info.timestamp} [${info.level}]: ${info.label} - ${info.message} - ${info.err}`,
);

const timezoned = () => {
  return new Date().toLocaleString("es-ES", {
    timeZone: "America/Lima",
  });
};

// define the custom settings for each transport (file, console)
const defaultOptions = {
  datePattern: "DD-MM-YYYY",
  format: combine(label({ label: "main" }), timestamp({ format: timezoned }), formato),
  handleExceptions: true,
  maxFiles: 100,
  colorize: true,
};

const options = {
  console: { level: "debug", filename: "./logs/debug.log", ...defaultOptions },
  info: {
    level: "info",
    filename: "./logs/info-%DATE%.log",
    meta: true,
    ...defaultOptions,
  },
  warning: {
    level: "warn",
    filename: "./logs/warning-%DATE%.log",
    ...defaultOptions,
  },
  error: {
    level: "error",
    filename: "./logs/error-%DATE%.log",
    maxsize: 5242880, // 5MB
    ...defaultOptions,
  },
};

// instantiate a new Winston Logger with the settings defined above
const logger = new winston.createLogger({
  transports: [
    //new winston.transports.Console(options.console),
    new winston.transports.DailyRotateFile(options.info),
    new winston.transports.DailyRotateFile(options.warning),
    new winston.transports.DailyRotateFile(options.error),
  ],
  exitOnError: false, // do not exit on handled exceptions
});

module.exports = logger;
