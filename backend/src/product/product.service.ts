import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductImageService } from './product-image.service';
import { ProductVariantService } from './product-variant.service';
import { CreateProductDto, FilterProductDto, UpdateProductDto } from './dto';
import { Prisma } from '@prisma/client';
import { LogService } from '../logger/log.service';

@Injectable()
export class ProductService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly productVariantService: ProductVariantService,
        private readonly productImageService: ProductImageService,
        private readonly logger: LogService,
    ) { }

    async findAll(filters: FilterProductDto) {
        const { name, categoryId, status, page = 1, priceMin = 0, priceMax } = filters;
        const itemsPerPage = 12;
        const skip = (page - 1) * itemsPerPage;

        this.logger.debug(`Finding all products with filters: ${JSON.stringify(filters)}`, ProductService.name);

        const where: Prisma.ProductWhereInput = {};

        if (name) {
            where.name = {
                contains: name,
                mode: 'insensitive',
            };
        }

        if (categoryId) {
            where.categoryId = categoryId;
        }

        if (status) {
            where.status = status;
        }

        if (priceMin || priceMax) {
            const priceCondition: any = {};
            if (priceMin) {
                priceCondition.gte = priceMin;
            }
            if (priceMax) {
                priceCondition.lte = priceMax;
            }

            where.variants = {
                some: {
                    prices: {
                        some: {
                            amount: priceCondition,
                        },},},
            };
        }

        const [totalItems, products] = await this.prisma.$transaction([
            this.prisma.product.count({ where }),
            this.prisma.product.findMany({
                where,
                include: { images: true, variants: { include: { prices: true } } },
                take: itemsPerPage,
                skip,
            })
        ]);

        const totalPages = Math.ceil(totalItems / itemsPerPage);

        return {
            data: products,
            meta: {
                totalItems,
                totalPages,
                currentPage: page,
            },
        };
    }

    async findById(id: string) {
        this.logger.debug(`Finding product by ID: ${id}`, ProductService.name);
        const product = await this.prisma.product.findUnique({
            where: { id: id }
        });

        if (!product) {
            this.logger.warn(`Product with ID ${id} not found.`, ProductService.name);
            throw new NotFoundException(`Product with ID ${id} not found.`);
        }

        return product;
    }

    async create(createProductDto: CreateProductDto) {
        this.logger.debug(`Attempting to create product with DTO: ${JSON.stringify(createProductDto)}`, ProductService.name);
        try {
            const newProduct = await this.prisma.$transaction(async (tx) => {
                // 1. Create the base product
                const product = await tx.product.create({
                    data: {
                        name: createProductDto.name,
                        slug: createProductDto.slug,
                        description: createProductDto.description,
                        status: createProductDto.status,
                        categoryId: createProductDto.categoryId,
                    }
                });

                // 2. Create variants using the service
                const variantPromises = createProductDto.variants.map(variantDto =>
                    this.productVariantService.create(product.id, variantDto, tx)
                );
                await Promise.all(variantPromises);

                // 3. Return the complete product with relations
                return tx.product.findUnique({
                    where: { id: product.id },
                    include: { variants: { include: { prices: true, inventory: true } }, images: true }
                });
            });

            this.logger.log(`Successfully created product with ID: ${newProduct?.id}`, ProductService.name);
            return newProduct;
        } catch (error) {
            this.logger.error('Failed to create product.', error.stack, ProductService.name);
            throw error; // Re-throw the error to be handled by NestJS exception filters
        }
    }

    async update(id: string, updateProductDto: UpdateProductDto) {
        this.logger.debug(`Attempting to update product ${id} with DTO: ${JSON.stringify(updateProductDto)}`, ProductService.name);
        
        // Ensure product exists before updating
        await this.findById(id);

        const updatedProduct = await this.prisma.product.update({
            where: { id: id },
            data: {
                ...updateProductDto
            }
        });

        this.logger.log(`Successfully updated product with ID: ${id}`, ProductService.name);
        return updatedProduct;
    }

    async remove(id: string) {
        this.logger.debug(`Attempting to remove product with ID: ${id}`, ProductService.name);
         return this.prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({
                where: { id: id },
                include: { images: true },
            });

            if (!product) {
                this.logger.warn(`Attempted to delete non-existent product with ID: ${id}`, ProductService.name);
                throw new NotFoundException(`Product with ID ${id} not found.`);
            }

            // 1. Delete all associated images (records and files)
            if (product.images && product.images.length > 0) {
                const deleteImageFilePromises = product.images.map(image =>
                    this.productImageService.delete(product.id, image.id, tx)
                );
                await Promise.all(deleteImageFilePromises);
            }
            
            // 2. Delete all associated variants and their children (prices, inventory)
            const variants = await tx.productVariant.findMany({ where: { productId: id }, select: { id: true } });
            if (variants.length > 0) {
                const deleteVariantPromises = variants.map(variant =>
                    this.productVariantService.delete(id, variant.id, tx)
                );
                await Promise.all(deleteVariantPromises);
            }

            // 3. Finally, delete the product itself.
            await tx.product.delete({ where: { id } });

            this.logger.log(`Successfully removed product with ID: ${id}`, ProductService.name);
            return { message: `Product with ID ${id} and its assets have been deleted.` };
        });
    }
}   
