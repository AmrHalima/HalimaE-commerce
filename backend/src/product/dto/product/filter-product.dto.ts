import { Status } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDecimal, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class FilterProductDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    categoryId?: string;

    @IsOptional()
    @IsEnum(Status)
    status?: Status;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    @IsOptional()
    @Type(() => Number)
    @Min(0)
    priceMin: number = 0;

    @IsOptional()
    @Type(() => Number)
    priceMax?: number;
}