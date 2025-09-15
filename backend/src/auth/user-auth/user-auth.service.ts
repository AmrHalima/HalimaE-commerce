import { Injectable, ConflictException, ForbiddenException } from '@nestjs/common';
import { CreateUserDto, LoginUserDto } from 'src/users/dto';
import { UsersService } from 'src/users/users.service';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserAuthService {
    constructor(
        private readonly userService: UsersService,
        private readonly jwtService: JwtService,
        private prisma: PrismaService
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
            throw new ForbiddenException('User not found');
        }

        const payload = {
            sub: user.id,
            email: user.email,
            roles: user.role?.name
        }

        return {
            user,
            access_token: await this.jwtService.signAsync(payload)
        }
    }
}

