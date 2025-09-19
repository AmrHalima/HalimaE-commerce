import { IsNumber, IsOptional, IsString } from "class-validator";

export class ProductImageDto{
    @IsString()
    @IsOptional()
    public alt?: string;

    @IsNumber()
    public sort: number;
}