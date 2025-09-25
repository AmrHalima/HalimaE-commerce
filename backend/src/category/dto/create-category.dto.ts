import { IsOptional, IsString, Length, ValidateIf } from "class-validator";

export class CreateCategoryDto{
    @IsString()
    @Length(3, 255)
    readonly name: string;

    @IsString()
    @Length(3, 255)
    readonly slug: string;

    @IsOptional()
    @ValidateIf((obj, value) => value !== null)
    @IsString()
    readonly parentId?: string | null;
}