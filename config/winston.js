const winston = require("winston");
import "winston-daily-rotate-file";
import moment from "moment";

const { combine, timestamp, label, prettyPrint, printf, errors } = winston.format;

var filename = module.filename.split("/").slice(-1);
const appendTimestamp = winston.format((info, opts) => {
  if (opts.tz)
    info.timestamp = moment()
      .tz(opts.tz)
      .format();
  return info;
});
const formato = printf(info => `${info.timestamp} [${info.level}]: ${info.label} - ${info.message} - ${info.err}`);

// define the custom settings for each transport (file, console)
var options = {
  console: {
    level: "debug",
    format: combine(label({ label: "main" }), appendTimestamp({ tz: "America/Lima" }), formato),
    filename: `./logs/debug.log`,
    handleExceptions: true,
    //json: true,
    //maxsize: 5242880, // 5MB
    maxFiles: 100,
    colorize: true
  },
  info: {
    level: "info",
    meta: true,
    datePattern: "DD-MM-YYYY",
    format: combine(label({ label: "main" }), appendTimestamp({ tz: "America/Lima" }), formato),
    filename: `./logs/info-%DATE%.log`,
    handleExceptions: true,
    //json: true,
    //maxsize: 5242880, // 5MB
    maxFiles: 100,
    colorize: true
  },
  warning: {
    level: "warn",
    datePattern: "DD-MM-YYYY",
    format: combine(label({ label: "main" }), appendTimestamp({ tz: "America/Lima" }), formato),
    filename: `./logs/warning-%DATE%.log`,
    handleExceptions: true,
    //json: true,
    //maxsize: 5242880, // 5MB
    maxFiles: 100,
    colorize: true
  },
  error: {
    level: "error",
    datePattern: "DD-MM-YYYY",
    format: combine(label({ label: "main" }), appendTimestamp({ tz: "America/Lima" }), prettyPrint()),
    filename: `./logs/error-%DATE%.log`,
    handleExceptions: true,
    //json: true,
    maxsize: 5242880, // 5MB
    maxFiles: 100,
    colorize: true
  }
};

// instantiate a new Winston Logger with the settings defined above
var logger = new winston.createLogger({
  transports: [
    //new winston.transports.Console(options.console),
    new winston.transports.DailyRotateFile(options.info),
    new winston.transports.DailyRotateFile(options.warning),
    new winston.transports.DailyRotateFile(options.error)
  ],
  exitOnError: false // do not exit on handled exceptions
});

module.exports = logger;
