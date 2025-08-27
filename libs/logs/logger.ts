import { Service } from 'typedi';
import * as winston from 'winston';

@Service()
export class Logger {

    private static logger = winston.createLogger({
        level: "info",
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        ),
        transports: [
            new winston.transports.Console() // logs to stdout
        ]
    });

    public static error(message) {
        this.logger.error(message);
    }

    public static warn(message) {
        this.logger.warn(message);
    }

    public static info(message) {
        this.logger.info(message);

    }

    public static debug(message) {
        this.logger.debug(message);
    }

}
