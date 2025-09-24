import {
    IsBoolean,
    IsOptional,
    IsPostalCode,
    IsString,
    Length
} from 'class-validator';

export class CreateAddressDto {
    @IsString()
    @Length(1, 1000)
    readonly firstName: string;

    @IsString()
    @Length(1, 1000)
    readonly lastName: string;

    @IsString()
    @IsOptional()
    @Length(3, 22)
    readonly phone?: string;

    @IsString()
    @Length(3, 255)
    readonly line1: string;

    @IsString()
    @IsOptional()
    @Length(3, 255)
    readonly line2?: string;

    @IsString()
    @Length(1, 1000)
    readonly city: string;

    @IsString()
    @Length(1, 1000)
    readonly country: string;

    @IsString()
    @IsPostalCode('any')
    @Length(1, 1000)
    readonly postalCode: string;

    @IsBoolean()
    readonly isDefault: boolean;
}