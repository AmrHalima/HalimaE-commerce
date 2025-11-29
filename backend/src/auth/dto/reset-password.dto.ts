import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class ResetPasswordDto {
    @ApiProperty({
        description: 'Password reset token received via email',
        example: 'a1b2c3d4e5f6...',
    })
    @IsString()
    @IsNotEmpty({ message: 'Reset token is required' })
    token: string;

    @ApiProperty({
        description: 'New password (8-16 characters)',
        example: 'NewSecurePass123',
        minLength: 8,
        maxLength: 16,
    })
    @IsString()
    @Length(8, 16, { message: 'Password must be between 8 and 16 characters' })
    @IsNotEmpty({ message: 'New password is required' })
    newPassword: string;
}