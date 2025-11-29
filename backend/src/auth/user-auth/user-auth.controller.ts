import { Body, Controller, Get, Post, Req, Res, UseGuards, UnauthorizedException, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiExtraModels, ApiCookieAuth } from '@nestjs/swagger';
import { ApiStandardResponse, ApiStandardErrorResponse } from '../../../common/swagger/api-response.decorator';
import { CreateUserDto, LoginUserDto, UserResponseDto } from '../../users/dto';
import { UserAuthService } from './user-auth.service';
import { JwtUserGuard, RolesGuard } from './guards';
import { Roles } from './decorators';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { ResetPasswordDto, ResetPasswordRequestDto } from '../dto';
import { Throttle } from '@nestjs/throttler';

@ApiTags('admin-auth')
@ApiExtraModels(CreateUserDto, LoginUserDto, UserResponseDto, ResetPasswordDto, ResetPasswordRequestDto)
@Controller('admin/auth')
export class UserAuthController {
    constructor(
        private readonly authService: UserAuthService,
        private readonly configService: ConfigService,
    ) { }

    // only admin can add new useres
    @Roles('admin')
    @UseGuards(JwtUserGuard, RolesGuard)
    @Post('signup')
    @ApiOperation({ summary: 'Admin user signup', description: 'Register a new admin or employee user. Only accessible by existing admin users.' })
    @ApiBearerAuth('JWT-auth')
    @ApiStandardResponse(UserResponseDto, 'User registered successfully', 201)
    @ApiStandardErrorResponse(400, 'Invalid registration data', 'Validation failed for user registration')
    @ApiStandardErrorResponse(401, 'Unauthorized', 'Authentication required')
    @ApiStandardErrorResponse(403, 'Forbidden', 'Only admins can create new users')
    @ApiStandardErrorResponse(409, 'Email already exists', 'A user with this email already exists')
    async signup(@Body() dto: CreateUserDto, @Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<UserResponseDto> {
        const { refresh_token, ...result } = await this.authService.signup(
            dto,
            req.headers['user-agent'],
            req.ip
        );

        res.cookie('refresh_token', refresh_token, {
            httpOnly: true,
            secure: this.configService.get('NODE_ENV') === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/api/admin/auth',
        });

        return result;
    }

    @Post('login')
    @ApiOperation({
        summary: 'Admin user login',
        description: 'Authenticate an admin or employee user. Returns access token in response body and sets refresh token as httpOnly cookie.'
    })
    @ApiStandardResponse(UserResponseDto, 'User logged in successfully')
    @ApiStandardErrorResponse(400, 'Invalid credentials', 'Email or password is incorrect')
    @ApiStandardErrorResponse(401, 'Unauthorized', 'Authentication failed')
    async login(@Body() dto: LoginUserDto, @Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<UserResponseDto> {
        const { refresh_token, ...result } = await this.authService.login(
            dto,
            req.headers['user-agent'],
            req.ip
        );

        res.cookie('refresh_token', refresh_token, {
            httpOnly: true,
            secure: this.configService.get('NODE_ENV') === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/api/admin/auth',
        });

        return result;
    }


    @Post('refresh-token')
    @HttpCode(200)
    @ApiCookieAuth('refresh_token')
    @ApiOperation({
        summary: 'Refresh access token',
        description: 'Get a new access token using the refresh token from httpOnly cookie. The old refresh token is revoked and a new one is set (token rotation).'
    })
    @ApiStandardResponse(Object, 'Token refreshed successfully')
    @ApiStandardErrorResponse(401, 'Unauthorized', 'Invalid, expired, or missing refresh token')
    async refreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<{ access_token: string }> {
        const refresh_token = req.cookies?.refresh_token;

        if (!refresh_token) {
            throw new UnauthorizedException('Refresh token not found');
        }

        const { access_token, refresh_token: new_refresh_token } = await this.authService.refreshToken(refresh_token);

        // Set new refresh token cookie
        res.cookie('refresh_token', new_refresh_token, {
            httpOnly: true,
            secure: this.configService.get('NODE_ENV') === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/api/admin/auth',
        });

        return { access_token };
    }

    @Post('logout')
    @HttpCode(200)
    @UseGuards(JwtUserGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Logout from current device',
        description: 'Revoke the refresh token for the current session/device only. Reads refresh token from httpOnly cookie and clears it.'
    })
    @ApiStandardResponse(Object, 'Logged out from current device successfully')
    async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<{ message: string }> {
        const refresh_token = req.cookies?.refresh_token;

        if (refresh_token) {
            await this.authService.logout(refresh_token);
        }

        // Clear the cookie
        res.clearCookie('refresh_token', {
            path: '/api/admin/auth',
        });

        return { message: 'Logged out from current device successfully' };
    }

    @Post('logout-all')
    @HttpCode(200)
    @UseGuards(JwtUserGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Logout from all devices',
        description: 'Revoke all refresh tokens for the authenticated user across all devices. Requires Bearer token authentication.'
    })
    @ApiStandardResponse(Object, 'Logged out from all devices successfully')
    @ApiStandardErrorResponse(401, 'Unauthorized', 'Authentication required')
    async logoutAll(@Req() req: any, @Res({ passthrough: true }) res: Response): Promise<{ message: string }> {
        await this.authService.logoutAll(req.user.sub);

        // Clear the cookie from current device
        res.clearCookie('refresh_token', {
            path: '/api/admin/auth',
        });

        return { message: 'Logged out from all devices successfully' };
    }

    @Get('sessions')
    @UseGuards(JwtUserGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Get active sessions',
        description: 'Retrieve all active sessions/devices for the authenticated user. Shows device info, IP, and expiration times. Requires Bearer token authentication.'
    })
    @ApiStandardResponse(Object, 'Active sessions retrieved successfully')
    @ApiStandardErrorResponse(401, 'Unauthorized', 'Authentication required')
    async getActiveSessions(@Req() req: any) {
        return this.authService.getActiveSessions(req.user.sub);
    }

    @Post('reset-password-request')
    @HttpCode(200)
    @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute per IP
    @ApiOperation({
        summary: 'Request password reset',
        description: 'Send a password reset link to the provided email address. Rate limited to 3 requests per minute. Returns same message whether email exists or not to prevent user enumeration.'
    })
    @ApiStandardResponse(Object, 'Password reset email sent if account exists')
    @ApiStandardErrorResponse(429, 'Too Many Requests', 'Rate limit exceeded. Please try again later.')
    async resetPassword(@Body() dto: ResetPasswordRequestDto): Promise<{ message: string }> {
        return this.authService.resetPassword(dto.email);
    }

    @Post('reset-password')
    @HttpCode(200)
    @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute per IP
    @ApiOperation({
        summary: 'Confirm password reset',
        description: 'Reset password using the token received via email. Token expires after 5 minutes. All active sessions will be invalidated after successful reset.'
    })
    @ApiStandardResponse(Object, 'Password reset successfully')
    @ApiStandardErrorResponse(403, 'Forbidden', 'Invalid or expired password reset token')
    @ApiStandardErrorResponse(429, 'Too Many Requests', 'Rate limit exceeded. Please try again later.')
    async resetPasswordConfirm(
        @Body() resetPasswordDto: ResetPasswordDto
    ): Promise<{ message: string }> {
        return this.authService.resetPasswordConfirm(resetPasswordDto);
    }
}
