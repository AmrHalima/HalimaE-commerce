import { CreateProductDto } from "./create-product.dto";

export class ResponseProductDto extends CreateProductDto {
    readonly id: string;
}