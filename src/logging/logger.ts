import { createLogger, format, transports } from "winston";

// Workers (Playwright spawns one Node process per worker) must NOT create a
// File transport — every worker would open the same logs/app.log stream,
// causing file-lock contention that noticeably delays browser launch.
// Console output is captured by Playwright's reporter and by CI log streams,
// so the file transport adds no observability benefit during test runs.
const logger = createLogger({
    level: "info",
    format: format.combine(
        format.timestamp(),
        format.printf(({ level, message, timestamp }) => {
            return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        })
    ),
    transports: [new transports.Console()]
});

export default logger;
