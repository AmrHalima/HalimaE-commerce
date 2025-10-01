import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiExtraModels } from '@nestjs/swagger';
import { ApiStandardResponse, ApiStandardErrorResponse } from '../../../common/swagger/api-response.decorator';
import { CreateUserDto, LoginUserDto, UserResponseDto } from '../../users/dto';
import { UserAuthService } from './user-auth.service';
import { JwtUserGuard, RolesGuard } from './guards';
import { Roles } from './decorators';

@ApiTags('admin-auth')
@ApiExtraModels(CreateUserDto, LoginUserDto, UserResponseDto)
@Controller('admin/auth')
export class UserAuthController {
    constructor(
        private readonly authService: UserAuthService
    ) { }

    // only admin can add new useres
    @Roles('admin')
    @UseGuards(JwtUserGuard, RolesGuard)
    @Post('signup')
    @ApiOperation({ summary: 'Admin user signup', description: 'Register a new admin or employee user. Only accessible by existing admin users.' })
    @ApiBearerAuth()
    @ApiStandardResponse(UserResponseDto, 'User registered successfully', 201)
    @ApiStandardErrorResponse(400, 'Invalid registration data', 'Validation failed for user registration')
    @ApiStandardErrorResponse(401, 'Unauthorized', 'Authentication required')
    @ApiStandardErrorResponse(403, 'Forbidden', 'Only admins can create new users')
    @ApiStandardErrorResponse(409, 'Email already exists', 'A user with this email already exists')
    async signup(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
        return this.authService.signup(dto);
    }

    @Post('login')
    @ApiOperation({ summary: 'Admin user login', description: 'Authenticate an admin or employee user and receive an access token' })
    @ApiStandardResponse(UserResponseDto, 'User logged in successfully')
    @ApiStandardErrorResponse(400, 'Invalid credentials', 'Email or password is incorrect')
    @ApiStandardErrorResponse(401, 'Unauthorized', 'Authentication failed')
    async login(@Body() dto: LoginUserDto): Promise<UserResponseDto> {
        return this.authService.login(dto);
    }
}
