import { IsOptional, IsString, Length, ValidateIf } from "class-validator";

export class CreateCategoryDto{
    @IsString()
    @Length(3, 255)
    name: string;

    @IsString()
    @Length(3, 255)
    slug: string;

    @IsOptional()
    @IsString()
    @ValidateIf((obj, value) => value !== null)
    parentId?: string | null;
}