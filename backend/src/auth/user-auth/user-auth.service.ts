import { Injectable, ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto, LoginUserDto } from '../../users/dto';
import { UsersService } from '../../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { LogService } from '../../logger/log.service';


@Injectable()
export class UserAuthService {
    constructor(
        private readonly userService: UsersService,
        private readonly jwtService: JwtService,
        private readonly logger: LogService,
    ) { }

    async signup(dto: CreateUserDto) {
        this.logger.debug(`Attempting to sign up user with email: ${dto.email}`, UserAuthService.name);
        if (await this.userService.findByEmail(dto.email)) {
            this.logger.warn(`Signup failed. User already exists: ${dto.email}`, UserAuthService.name);
            throw new ConflictException("user already exists");
        }
        const user = await this.userService.create(dto);
        this.logger.log(`User created successfully: ${user.email} (ID: ${user.id})`, UserAuthService.name);
        return this.login({
            email: user.email,
            password: dto.password,
        });
    }

    async login(dto: LoginUserDto) {
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

        const { passwordHash, provider, providerId, ...userWithoutPassword } = user;
        return {
            user: userWithoutPassword,
            access_token: await this.jwtService.signAsync(payload)
        }
    }
}
