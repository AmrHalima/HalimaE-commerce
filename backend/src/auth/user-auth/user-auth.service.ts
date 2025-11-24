import { Injectable, ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto, LoginUserDto, UserResponseDto } from '../../users/dto';
import { UsersService } from '../../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { LogService } from '../../logger/log.service';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

@Injectable()
export class UserAuthService {
    constructor(
        private readonly userService: UsersService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly logger: LogService,
    ) { }

    async signup(dto: CreateUserDto, device?: string, ip?: string): Promise<UserResponseDto & { refresh_token: string }> {
        this.logger.debug(`Attempting to sign up user with email: ${dto.email}`, UserAuthService.name);
        const user = await this.userService.create(dto);
        this.logger.log(`User created successfully: ${user.email} (ID: ${user.id})`, UserAuthService.name);
        return this.login({
            email: user.email,
            password: dto.password,
        });
    }

    async login(dto: LoginUserDto, device?: string, ip?: string): Promise<UserResponseDto & { refresh_token: string }> {
        this.logger.debug(`Attempting to log in user: ${dto.email}`, UserAuthService.name);
        const user = await this.userService.findByEmail(dto.email);
        if (!user) {
            this.logger.warn(`Login failed. User not found: ${dto.email}`, UserAuthService.name);
            throw new UnauthorizedException('User not found');
        }

        if (! (await argon2.verify(user.passwordHash ?? '', dto.password)) ) {
            this.logger.warn(`Login failed. Invalid credentials for user: ${dto.email}`, UserAuthService.name);
            throw new UnauthorizedException('Invalid credentials');
        }

        this.logger.log(`User logged in successfully: ${user.email} (ID: ${user.id})`, UserAuthService.name);

        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role?.name
        }

        const access_token = await this.jwtService.signAsync(payload, {
            secret: this.configService.get<string>('JWT_USER_SECRET')!,
            expiresIn: this.configService.get<string>('JWT_USER_EXPIRES_IN') ?? '15m' as any,
        });

        const refresh_token = await this.jwtService.signAsync({
            ...payload,
            jti: randomUUID(), // Add unique identifier
        } as any, {
            secret: this.configService.get<string>('JWT_USER_REFRESH_SECRET')!,
            expiresIn: this.configService.get<string>('JWT_USER_REFRESH_EXPIRES_IN') ?? '7d' as any,
        });

        const hashedRefreshToken = await argon2.hash(refresh_token);
        await this.userService.storeRefreshToken(user.id, hashedRefreshToken, device, ip);

        return {
            name: user.name,
            email: user.email,
            role: user.role,
            access_token,
            refresh_token,
        }
    }

    async refreshToken(refresh_token: string): Promise<{ access_token: string, refresh_token: string }> {
        let payload: any;
        try {
            payload = await this.jwtService.verifyAsync(refresh_token, {
                secret: this.configService.get<string>('JWT_USER_REFRESH_SECRET')!,
            });
        } catch (error) {
            this.logger.warn(`Refresh token verification failed: ${error.message}`, UserAuthService.name);
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        const userTokens = await this.userService.findRefreshTokensByUserId(payload.sub);

        if (!userTokens || userTokens.length === 0) {
            this.logger.warn(`No valid refresh tokens found for user: ${payload.sub}`, UserAuthService.name);
            throw new UnauthorizedException('Invalid refresh token');
        }

        let matchedToken = null;
        for (const storedToken of userTokens) {
            if (await argon2.verify(storedToken.tokenHash, refresh_token)) {
                matchedToken = storedToken;
                break;
            }
        }

        if (!matchedToken) {
            this.logger.warn(`Refresh token hash not found for user: ${payload.sub}`, UserAuthService.name);
            throw new UnauthorizedException('Invalid refresh token');
        }

        // Revoke the old token (prevent reuse)
        await this.userService.revokeRefreshToken(matchedToken.id);

        // Generate new tokens
        const newPayload = {
            sub: matchedToken.user.id,
            email: matchedToken.user.email,
            role: matchedToken.user.role,
        };

        const access_token = await this.jwtService.signAsync(newPayload, {
            secret: this.configService.get<string>('JWT_USER_SECRET')!,
            expiresIn: this.configService.get<string>('JWT_USER_EXPIRES_IN') ?? '15m' as any,
        });

        const new_refresh_token = await this.jwtService.signAsync({
            ...newPayload,
            jti: randomUUID(), // Add unique identifier
        }, {
            secret: this.configService.get<string>('JWT_USER_REFRESH_SECRET')!,
            expiresIn: this.configService.get<string>('JWT_USER_REFRESH_EXPIRES_IN') ?? '7d' as any,
        });

        // Step 6: Store the new refresh token
        await this.userService.storeRefreshToken(
            matchedToken.user.id,
            await argon2.hash(new_refresh_token),
            matchedToken.device,
            matchedToken.ip
        );

        this.logger.log(`Refresh token rotated successfully for user: ${matchedToken.user.id}`, UserAuthService.name);

        return {
            access_token,
            refresh_token: new_refresh_token,
        };
    }

    async logout(refresh_token: string): Promise<void> {
        // Verify the token and get user info
        let payload: any;
        try {
            payload = await this.jwtService.verifyAsync(refresh_token, {
                secret: this.configService.get<string>('JWT_USER_REFRESH_SECRET')!,
            });
        } catch (error) {
            this.logger.warn(`Logout failed: Invalid refresh token`, UserAuthService.name);
            throw new UnauthorizedException('Invalid refresh token');
        }

        // Find and revoke ONLY this specific token
        const userTokens = await this.userService.findRefreshTokensByUserId(payload.sub);

        for (const storedToken of userTokens) {
            if (await argon2.verify(storedToken.tokenHash, refresh_token)) {
                await this.userService.revokeRefreshToken(storedToken.id);
                this.logger.log(`Logged out user ${payload.sub} from device: ${storedToken.device || 'unknown'}`, UserAuthService.name);
                return;
            }
        }

        this.logger.warn(`Logout: Token not found for user ${payload.sub}`, UserAuthService.name);
    }

    async logoutAll(userId: string): Promise<void> {
        this.logger.log(`Logging out user from all devices: ${userId}`, UserAuthService.name);
        await this.userService.revokeAllUserRefreshTokens(userId);
    }

    async getActiveSessions(userId: string) {
        return this.userService.getActiveSessions(userId);
    }
}
