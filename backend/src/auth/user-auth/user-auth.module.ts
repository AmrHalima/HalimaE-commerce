import { Module } from '@nestjs/common';
import { JwtUserStrategy } from './strategies/jwt.user.strategy/jwt.user.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { UserAuthController } from './user-auth.controller';
import { UserAuthService } from './user-auth.service';
import { UsersModule } from '../../users/users.module';

@Module({
    imports: [
        PassportModule,
        JwtModule.register({
            secret: process.env.JWT_USER_SECRET,
            signOptions: { expiresIn: "4h", },
        }),
        UsersModule
    ],
    providers: [JwtUserStrategy, UserAuthService],
    controllers: [UserAuthController]
})
export class UserAuthModule {}
