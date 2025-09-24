import { Module } from '@nestjs/common';
import { UserAuthModule } from './user-auth/user-auth.module';
import { CustomerAuthModule } from './customer-auth/customer-auth.module';

@Module({
  imports: [UserAuthModule, CustomerAuthModule]
})
export class AuthModule {}
