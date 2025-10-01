import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CustomerAuthService } from './customer-auth.service';
import { JwtModule } from '@nestjs/jwt';
import { CustomerAuthController } from './customer-auth.controller';
import { CustomerModule } from '../../customer/customer.module';
import { JwtCustomerStrategy } from './strategies/jwt.customer.strategy';

@Module({
    imports: [
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_CUSTOMER_SECRET'),
                signOptions: { expiresIn: '1d' },
            }),
        }),
        CustomerModule,
    ],
    providers: [CustomerAuthService, JwtCustomerStrategy],
    controllers: [CustomerAuthController]
})
export class CustomerAuthModule {}
