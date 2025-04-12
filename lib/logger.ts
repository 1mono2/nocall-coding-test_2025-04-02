import { createLogger, format, transports } from "winston";

const logLevel = process.env.LOG_LEVEL || "info";

const logger = createLogger({
	level: logLevel,
	format: format.combine(
		format.colorize(),
		format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
		format.errors({ stack: true }),
		format.printf(({ timestamp, level, message, ...meta }) => {
			return `${timestamp} [${level}]: ${message} ${JSON.stringify(meta)}`;
		}),
	),
	transports: [new transports.Console()],
});

export default logger;
