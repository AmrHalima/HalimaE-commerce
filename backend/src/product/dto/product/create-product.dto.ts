import {
    IsArray,
    IsEnum,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ProductImageDto } from '../image/product-image.dto';
import { ProductVariantDto } from '../variant/product-variant.dto';
import { Status } from '@prisma/client';

export class CreateProductDto {
    @IsString()
    public name: string;

    @IsString()
    @IsOptional()
    public description?: string;

    @IsString()
    public slug: string;

    @IsEnum(Status)
    public status: Status;

    @IsString()
    public categoryId: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProductVariantDto)
    @Transform(({ value }) => (typeof value === 'string' ? JSON.parse(value) : value))
    public variants: ProductVariantDto[];
}