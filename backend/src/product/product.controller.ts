import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UploadedFiles,
    UseInterceptors,
    UseGuards,
    Query,
    BadRequestException,
    HttpCode,
    HttpStatus,
    Put,
    UploadedFile,
} from '@nestjs/common';
import { ProductService } from './product.service';
import {
    CreateProductDto,
    FilterProductDto,
    ProductImageDto,
    ProductVariantDto,
    ResponseProductDto,
    ResponseVariantDto,
    UpdateProductDto,
    UpdateVariantDto,
} from './dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Roles } from '../auth/user-auth/decorators';
import { JwtUserGuard, RolesGuard } from '../auth/user-auth/guards';
import { ProductVariantService } from './product-variant.service';
import { ProductImageService } from './product-image.service';
import { ParseJsonPipe } from '../utils/parse-json.pipe';

@Controller('products')
export class ProductController {
    constructor(
        private readonly productService: ProductService,
        private readonly productVariantService: ProductVariantService,
        private readonly productImageService: ProductImageService
    ) { }

    @Get()
    async getProducts(
        @Query() filters: FilterProductDto
    ) {
        return this.productService.findAll(filters);
    }

    @Get(':id')
    async getProductById(@Param('id') id: string): Promise<ResponseProductDto> {
        return this.productService.findById(id);
    }

    @Get(':id/variants')
    async getProductVariants(@Param('id') id: string): Promise<ResponseVariantDto[]> {
        return this.productVariantService.getVariantsByProductId(id);
    }

    @Get(':id/images')
    async getProductImages(@Param('id') id: string) {
        return this.productImageService.getImagesByProductId(id);
    }


    // 1. create prduct with its variants routes
    @Post()
    @Roles('admin', 'employee')
    @UseGuards(JwtUserGuard, RolesGuard)
    @HttpCode(HttpStatus.CREATED)
    async createProduct(
        @Body() productDto: CreateProductDto,
    ): Promise<ResponseProductDto | null> {
        return this.productService.create(productDto);
    }

    // 2. handel images upload separtly from product creatio to avoid multipart issues
    @Post(':id/images')
    @Roles('admin', 'employee')
    @UseGuards(JwtUserGuard, RolesGuard)
    @UseInterceptors(FilesInterceptor('images', 10))
    @HttpCode(HttpStatus.CREATED)
    async addImages(
        @Param('id') id: string,
        @Body('imagesMeta', new ParseJsonPipe())
        productImagesDto: ProductImageDto[],
        @UploadedFiles() images: Array<Express.Multer.File>
    ) {
        // validate metadata length matches images length if metadata provided
        if (!images || images.length === 0) {
            throw new BadRequestException('At least one image file must be uploaded.');
        }
        // If productImagesDto has content, its length must match the number of files.
        if (productImagesDto && productImagesDto.length > 0 && productImagesDto.length !== images.length) {
            throw new BadRequestException('The number of image metadata objects does not match the number of uploaded files.');
        }

        return this.productImageService.createMany(id, productImagesDto, images);
    }

    @Post(':id/variants')
    @Roles('admin', 'employee')
    @UseGuards(JwtUserGuard, RolesGuard)
    @HttpCode(HttpStatus.CREATED)
    async addVariant(
        @Param('id') id: string,
        @Body() variantDto: ProductVariantDto
    ): Promise<ResponseVariantDto> {
        return this.productVariantService.create(id, variantDto);
    }

    @Patch(':id')
    @Roles('admin', 'employee')
    @UseGuards(JwtUserGuard, RolesGuard)
    @HttpCode(HttpStatus.OK)
    async updateProduct(
        @Param('id') id: string,
        @Body() updateProductDto: UpdateProductDto,
    ): Promise<ResponseProductDto> {
        return this.productService.update(id, updateProductDto);
    }

    @Patch(':id/variants/:variantId')
    @Roles('admin', 'employee')
    @UseGuards(JwtUserGuard, RolesGuard)
    @HttpCode(HttpStatus.OK)
    async updateVariant(
        @Param('id') id: string,
        @Param('variantId') variantId: string,
        @Body() variantDto: UpdateVariantDto,
    ): Promise<ResponseVariantDto> {
        return this.productVariantService.update(id, variantId, variantDto);
    }


    // replace product's single image
    @Put(':id/images/:imageId')
    @Roles('admin', 'employee')
    @UseGuards(JwtUserGuard, RolesGuard)
    @UseInterceptors(FileInterceptor('image'))
    @HttpCode(HttpStatus.OK)
    async replaceImage(
        @Param('id') id: string,
        @Param('imageId') imageId: string,
        @UploadedFile() image: Express.Multer.File,
    ) {
        return this.productImageService.replace(id, imageId, image);
    }

    @Delete(':id')
    @Roles('admin', 'employee')
    @UseGuards(JwtUserGuard, RolesGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeProduct(@Param('id') id: string) {
        await this.productService.remove(id);
    }


    @Delete(':id/variants/:variantId')
    @Roles('admin', 'employee')
    @UseGuards(JwtUserGuard, RolesGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeVariant(@Param('id') id: string, @Param('variantId') variantId: string) {
        await this.productVariantService.delete(id, variantId);
    }


    @Delete(':id/images/:imageId')
    @Roles('admin', 'employee')
    @UseGuards(JwtUserGuard, RolesGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeImage(@Param('id') id: string, @Param('imageId') imageId: string) {
        await this.productImageService.delete(id, imageId);
    }
}