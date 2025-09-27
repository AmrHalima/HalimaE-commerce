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
    readonly sku: string;

    @IsString()
    @IsOptional()
    readonly size?: string | null;

    @IsString()
    @IsOptional()
    readonly color?: string | null;

    @IsString()
    @IsOptional()
    readonly material?: string | null;

    @IsBoolean()
    @IsOptional()
    readonly isActive?: boolean | null = true ;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => VariantPriceDto)
    readonly prices: VariantPriceDto[];

    @IsOptional()
    @ValidateNested()
    @Type(() => VariantInventoryDto)
    readonly inventory?: VariantInventoryDto | null;
}