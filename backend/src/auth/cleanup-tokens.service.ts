import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { UsersService } from '../users/users.service';
import { CustomerService } from '../customer/customer.service';
import { LogService } from '../logger/log.service';

@Injectable()
export class CleanupTokensService {
    constructor(
        private readonly userService: UsersService,
        private readonly customerService: CustomerService,
        private readonly logger: LogService,
    ) { }

    @Cron('0 0 * * *', { name: 'cleanupExpiredTokens' }) // Runs every day at midnight
    async cleanupExpiredTokens() {
        this.logger.log('Starting cleanup of expired tokens', CleanupTokensService.name);
        await this.userService.cleanupExpiredTokens();
        await this.customerService.cleanupExpiredTokens();
        this.logger.log('Finished cleanup of expired tokens', CleanupTokensService.name);
    }

    @Cron('0 1 * * *', { name: 'cleanupResetTokens' }) // Runs every day at 1 AM
    async cleanupResetTokens() {
        this.logger.log('Starting cleanup of expired password reset tokens', CleanupTokensService.name);
        // it already removes all expired tokens no need to call customer service version
        await this.userService.cleanupExpiredResetTokens();
        this.logger.log('Finished cleanup of expired password reset tokens', CleanupTokensService.name);
    }
}
