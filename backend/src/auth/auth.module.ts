import { Module } from '@nestjs/common';
import { UserAuthModule } from './user-auth/user-auth.module';
import { CustomerAuthModule } from './customer-auth/customer-auth.module';
import { CleanupTokensService } from './cleanup-tokens.service';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersModule } from '../users/users.module';
import { CustomerModule } from '../customer/customer.module';

@Module({
    imports: [
        UserAuthModule,
        CustomerAuthModule,
        UsersModule,
        CustomerModule,
        ScheduleModule.forRoot()
    ],
    providers: [CleanupTokensService]
})
export class AuthModule {}
