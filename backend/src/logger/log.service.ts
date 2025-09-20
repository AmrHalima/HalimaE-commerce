import {
    Injectable,
    LoggerService,
    LogLevel
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

@Injectable()
export class LogService implements LoggerService{
    private readonly _logger: winston.Logger;
    constructor(
        private readonly configService: ConfigService
    ) {
        const transports = [];
        if( this.configService.get('NODE_ENV') === 'production' ){
            transports.push(
                new winston.transports.DailyRotateFile({
                    filename: 'logs/application-%DATE%.log',
                    datePattern: 'YYYY-MM-DD-HH',
                    zippedArchive: true,
                    maxSize: '20m',
                    maxFiles: '14d',
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.json()
                    )
                })
            );
        } else {
            transports.push(
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.colorize(),
                        winston.format.simple()
                    ),
                }),
            );
        }

        this._logger = winston.createLogger({
            level: 'info',
            transports
        });
    }

    log(message: string, context?: string, ...optionalParams: any[]) {
        this._logger.info(message, { context, optionalParams });
    }

    error(message: string, trace?: string, context?: string, ...optionalParams: any[]) {
        this._logger.error(message, { trace, context, optionalParams });
    }
    
    warn(message: string, context?: string, ...optionalParams: any[]) {
        this._logger.warn(message, { context, optionalParams });
    }
    
    debug?(message: string, context?: string, ...optionalParams: any[]) {
       if (this.configService.get('NODE_ENV') !== 'production')
            this._logger.debug(message, { context, optionalParams });
    }
    
    verbose?(message: string, context?: string, ...optionalParams: any[]) {
        if (this.configService.get('NODE_ENV') !== 'production')
            this._logger.verbose(message, { context, optionalParams });
    }
    
    fatal?(message: string, context?: string, ...optionalParams: any[]) {
        this._logger.crit(message, { context, optionalParams });
    }
    
    setLogLevels?(levels: LogLevel[]) {
        this._logger.level = levels.join(',');
    }
}
