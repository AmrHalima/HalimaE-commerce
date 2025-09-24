import { Injectable, ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto, LoginUserDto } from '../../users/dto';
import { UsersService } from '../../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';


@Injectable()
export class UserAuthService {
    constructor(
        private readonly userService: UsersService,
        private readonly jwtService: JwtService,
    ) { }

    async signup(dto: CreateUserDto) {
        if (await this.userService.findByEmail(dto.email)) {
            throw new ConflictException("user already exists");
        }
        const user = await this.userService.create(dto);
        return this.login({
            email: user.email,
            password: dto.password,
        });
    }

    async login(dto: LoginUserDto) {
        const user = await this.userService.findByEmail(dto.email);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        if (! (await argon2.verify(user.passwordHash ?? '', dto.password)) ) {
            throw new UnauthorizedException('Invalid credentials');
        }


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

