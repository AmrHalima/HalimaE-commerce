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
}
