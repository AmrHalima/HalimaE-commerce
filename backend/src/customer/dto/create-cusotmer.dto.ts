import { 
    IsEmail,
    IsEnum,
    IsOptional,
    IsString,
    Length,
} from "class-validator";
import { Status } from "@prisma/client";

export class CreateCustomerDto {
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
    @Length(8, 16)
    readonly phone?: string;

    @IsEnum(Status)
    readonly status: Status = Status.ACTIVE;

    @IsOptional()
    @IsString()
    readonly provider?: string;

    @IsOptional()
    @IsString()
    readonly providerId?: string;
}