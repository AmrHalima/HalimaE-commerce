import { ResponseProductDto } from "./response-product.dto";

export interface ResponseProductFilteredDto {
    readonly products: ResponseProductDto[];
    readonly meta: {
        readonly totalPages: number;
        readonly currentPage: number;
        readonly totalProducts: number;
    }
}