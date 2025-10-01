import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtUserStrategy } from './strategies/jwt.user.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { UserAuthController } from './user-auth.controller';
import { UserAuthService } from './user-auth.service';
import { UsersModule } from '../../users/users.module';

@Module({
    imports: [
        PassportModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_USER_SECRET'),
                signOptions: { expiresIn: '4h' },
            }),
        }),
        UsersModule
    ],
    providers: [JwtUserStrategy, UserAuthService],
    controllers: [UserAuthController]
})
export class UserAuthModule {}
