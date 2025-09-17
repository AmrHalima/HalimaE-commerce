import { Module } from '@nestjs/common';
import { ProductVariantService } from './product-variant.service';
import { ProductImageService } from './product-image.service';

@Module({
  providers: [ProductVariantService, ProductImageService]
})
export class ProductModule {}
