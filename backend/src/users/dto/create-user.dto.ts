import {
    IsEmail,
    IsEnum,
    IsOptional,
    IsString,
    IsUUID,
    Length,
} from "class-validator";
import { PROVIDER } from "@prisma/client";

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
    @IsEnum(PROVIDER)
    readonly providerId?: PROVIDER = 'LOCAL';

    @IsOptional()
    @IsString()
    @IsUUID()
    readonly roleId: string;
}