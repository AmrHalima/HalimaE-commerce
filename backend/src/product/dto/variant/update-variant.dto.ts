import { OmitType, PartialType } from "@nestjs/mapped-types";
import { ProductVariantDto } from "./product-variant.dto";
import { VariantPriceDto } from "./variant-price.dto";
import { IsOptional, IsUUID } from "class-validator";

export class UpdateVariantDto extends PartialType(OmitType(ProductVariantDto, ['prices'] as const)) {
    @IsOptional()
    readonly prices?: UpdateVariantPriceDto[];
}

export class UpdateVariantPriceDto extends PartialType(VariantPriceDto) {
    @IsOptional()
    @IsUUID()
    id: string; 
}