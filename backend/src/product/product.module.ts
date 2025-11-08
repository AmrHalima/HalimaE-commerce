import { Module } from '@nestjs/common';
import { ProductVariantService } from './product-variant.service';
import { ProductImageService } from './product-image.service';
import { MulterModule } from '@nestjs/platform-express';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { memoryStorage } from 'multer';

@Module({
    imports: [
        MulterModule.register({
            storage: memoryStorage(),
        }),
    ],
    controllers: [ProductController],
    providers: [ProductService, ProductVariantService, ProductImageService],
    exports: [ProductService, ProductImageService, ProductVariantService],
})
export class ProductModule {}
