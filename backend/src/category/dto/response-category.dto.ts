import { OmitType } from "@nestjs/mapped-types";
import { CreateCategoryDto } from "./create-category.dto";


export class ResponseCategoryDto extends OmitType(CreateCategoryDto, ['parentId'] as const) {
    readonly id: string;
    readonly parent?: ResponseCategoryDto | null;
}