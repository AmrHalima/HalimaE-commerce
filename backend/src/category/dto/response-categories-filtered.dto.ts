import { ResponseCategoryDto } from "./response-category.dto";

export class ResponseCategoriesFilteredDto {
    readonly categories: ResponseCategoryDto[];
    readonly meta: {
        readonly totalPages: number;
        readonly currentPage: number;
        readonly totalCategories: number;
    }
}