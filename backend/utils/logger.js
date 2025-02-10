const winston = require("winston");
const config = require("../config/app");

const logger = winston.createLogger({
  level: config.env === "development" ? "debug" : "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({ 
      filename: "error.log", 
      level: "error",
      dirname: "logs" 
    }),
    new winston.transports.File({ 
      filename: "combined.log",
      dirname: "logs" 
    }),
  ],
});

module.exports = logger;
