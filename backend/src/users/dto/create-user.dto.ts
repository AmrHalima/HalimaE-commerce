import { 
    ArrayNotEmpty,
    IsArray,
    IsEmail,
    IsOptional,
    IsString,
    Length,
} from "class-validator";

export class CreateUserDto {
    @IsString()
    @Length(3, 255)
    readonly name: string;

    @IsString()
    @IsEmail()
    @Length(3, 255)
    readonly email: string;

    @IsString()
    @Length(8, 16)
    readonly password: string;

    @IsOptional()
    @IsString()
    readonly provider?: string;

    @IsOptional()
    @IsString()
    readonly providerId?: string;

    @IsOptional()
    @IsString()
    readonly roleId: string;
}