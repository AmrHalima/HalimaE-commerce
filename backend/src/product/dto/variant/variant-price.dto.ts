import { Type } from 'class-transformer';
import { IsDecimal, IsOptional, IsString } from 'class-validator';

export class VariantPriceDto {
    @IsString()
    public currency: string;

    @IsDecimal()
    @Type(() => String)
    public amount: string;

    @IsOptional()
    @IsDecimal()
    @Type(() => String)
    public compareAt?: string;
}