import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CreateUserDto, LoginUserDto, UserResponseDto } from '../../users/dto';
import { UserAuthService } from './user-auth.service';
import { JwtUserGuard, RolesGuard } from './guards';
import { Roles } from './decorators';

@Controller('admin/auth')
export class UserAuthController {
    constructor(
        private readonly authService: UserAuthService
    ) { }

    // only admin can add new useres
    @Roles('admin')
    @UseGuards(JwtUserGuard, RolesGuard)
    @Post('signup')
    async signup(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
        return this.authService.signup(dto);
    }

    @Post('login')
    async login(@Body() dto: LoginUserDto): Promise<UserResponseDto> {
        return this.authService.login(dto);
    }
}
