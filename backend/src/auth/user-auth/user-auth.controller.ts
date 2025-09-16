import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CreateUserDto, LoginUserDto } from 'src/users/dto';
import { UserAuthService } from './user-auth.service';
import { Roles } from './decorators';
import { JwtUserGuard, RolesGuard } from './guards';
@Controller('admin/auth')
export class UserAuthController {
    constructor(
        private readonly authService: UserAuthService
    ) { }

    @Post('signup')
    async signup(@Body() dto: CreateUserDto) {
        return await this.authService.signup(dto);
    }

    @Post('login')
    async login(@Body() dto: LoginUserDto) {
        return await this.authService.login(dto);
    }
}
