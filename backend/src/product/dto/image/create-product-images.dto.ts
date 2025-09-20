import { Transform, Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { ProductImageDto } from './product-image.dto';
 class CreateProductImagesDto {
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProductImageDto)
    @Transform(({ value }) =>
        typeof value === 'string' ? JSON.parse(value) : value,
    )
    imagesMeta?: ProductImageDto[];
}
