import {
    IsBoolean,
    IsOptional,
    IsPostalCode,
    IsString,
    Length
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAddressDto {
    @ApiProperty({
        description: 'First name',
        example: 'John',
        minLength: 1,
        maxLength: 1000
    })
    @IsString()
    @Length(1, 1000)
    readonly firstName: string;

    @ApiProperty({
        description: 'Last name',
        example: 'Doe',
        minLength: 1,
        maxLength: 1000
    })
    @IsString()
    @Length(1, 1000)
    readonly lastName: string;

    @ApiProperty({
        description: 'Phone number',
        example: '+1234567890',
        required: false,
        minLength: 3,
        maxLength: 22
    })
    @IsString()
    @IsOptional()
    @Length(3, 22)
    readonly phone?: string;

    @ApiProperty({
        description: 'Address line 1 (street address)',
        example: '123 Main Street',
        minLength: 3,
        maxLength: 255
    })
    @IsString()
    @Length(3, 255)
    readonly line1: string;

    @ApiProperty({
        description: 'Address line 2 (apartment, suite, etc.)',
        example: 'Apt 4B',
        required: false,
        minLength: 3,
        maxLength: 255
    })
    @IsString()
    @IsOptional()
    @Length(3, 255)
    readonly line2?: string;

    @ApiProperty({
        description: 'City',
        example: 'New York',
        minLength: 1,
        maxLength: 1000
    })
    @IsString()
    @Length(1, 1000)
    readonly city: string;

    @ApiProperty({
        description: 'Country',
        example: 'United States',
        minLength: 1,
        maxLength: 1000
    })
    @IsString()
    @Length(1, 1000)
    readonly country: string;

    @ApiProperty({
        description: 'Postal/ZIP code',
        example: '10001',
        minLength: 1,
        maxLength: 1000
    })
    @IsString()
    @IsPostalCode('any')
    @Length(1, 1000)
    readonly postalCode: string;

    @ApiProperty({
        description: 'Whether this is the default address',
        example: true
    })
    @IsBoolean()
    readonly isDefault: boolean;
}