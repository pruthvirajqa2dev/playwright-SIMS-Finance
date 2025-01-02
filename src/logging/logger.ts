import { createLogger, format, transports } from "winston";

const logger = createLogger({
    level: "info", // Default logging level
    format: format.combine(
        format.timestamp(),
        format.printf(({ level, message, timestamp }) => {
            return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        })
    ),
    transports: [
        new transports.Console(), // Log to the console
        new transports.File({ filename: "logs/app.log" }) // Log to a file
    ]
});

export default logger;
