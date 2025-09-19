import {
    IsArray,
    IsBoolean,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { VariantPriceDto } from './variant-price.dto';
import { VariantInventoryDto } from './variant-inventory.dto';

export class ProductVariantDto {
    @IsString()
    @IsOptional()
    public sku: string;

    @IsString()
    @IsOptional()
    public size?: string;

    @IsString()
    @IsOptional()
    public color?: string;

    @IsString()
    @IsOptional()
    public material?: string;

    @IsBoolean()
    @IsOptional()
    public isActive?: boolean = true;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => VariantPriceDto)
    @Transform(({ value }) => (typeof value === 'string' ? JSON.parse(value) : value))
    public prices: VariantPriceDto[];

    @IsOptional()
    @ValidateNested()
    @Type(() => VariantInventoryDto)
    @Transform(({ value }) => (typeof value === 'string' ? JSON.parse(value) : value))
    public inventory?: VariantInventoryDto;
}