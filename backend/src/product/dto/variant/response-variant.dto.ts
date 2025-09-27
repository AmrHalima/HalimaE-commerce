import { ProductVariantDto } from "./product-variant.dto";

export class ResponseVariantDto extends ProductVariantDto {
    readonly id: string;
    readonly productId: string;
}