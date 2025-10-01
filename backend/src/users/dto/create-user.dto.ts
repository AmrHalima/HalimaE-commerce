import {
    IsEmail,
    IsEnum,
    IsOptional,
    IsString,
    IsUUID,
    Length,
} from "class-validator";
import { PROVIDER } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserDto {
    @ApiProperty({
        description: 'User full name',
        example: 'Admin User',
        minLength: 3,
        maxLength: 255
    })
    @IsString()
    @Length(3, 255)
    readonly name: string;

    @ApiProperty({
        description: 'User email address',
        example: 'admin@example.com',
        minLength: 3,
        maxLength: 255
    })
    @IsString()
    @IsEmail()
    @Length(3, 255)
    readonly email: string;

    @ApiProperty({
        description: 'User password',
        example: 'SecurePass123',
        minLength: 8,
        maxLength: 16
    })
    @IsString()
    @Length(8, 16)
    readonly password: string;

    @ApiProperty({
        description: 'OAuth provider name',
        example: 'google',
        required: false
    })
    @IsOptional()
    @IsString()
    readonly provider?: string;

    @ApiProperty({
        description: 'OAuth provider type',
        enum: PROVIDER,
        default: PROVIDER.LOCAL,
        required: false
    })
    @IsOptional()
    @IsEnum(PROVIDER)
    readonly providerId?: PROVIDER = 'LOCAL';

    @ApiProperty({
        description: 'Role ID to assign to the user',
        example: '123e4567-e89b-12d3-a456-426614174000',
        required: false
    })
    @IsOptional()
    @IsString()
    @IsUUID()
    readonly roleId: string;
}