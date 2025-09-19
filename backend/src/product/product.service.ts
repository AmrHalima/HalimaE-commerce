import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductImageService } from './product-image.service';
import { ProductVariantService } from './product-variant.service';
import { CreateProductDto, FilterProductDto, UpdateProductDto } from './dto';
import { Prisma } from '@prisma/client';


@Injectable()
export class ProductService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly productVariantService: ProductVariantService,
        private readonly productImageService: ProductImageService
    ) { }

    async findAll(filters: FilterProductDto) {
        const { name, categoryId, status, page = 1, priceMin = 0, priceMax } = filters;
        const itemsPerPage = 12;
        const skip = (page - 1) * itemsPerPage;

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
        const product = await this.prisma.product.findUnique({
            where: { id: id }
        });

        if (!product) {
            throw new NotFoundException(`Product with ID ${id} not found.`);
        }

        return product;
    }

    async create(createProductDto: CreateProductDto) {
        return this.prisma.$transaction(async (tx) => {
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

            // // 3. Create images using the service
            // const imagePromises = createProductDto.images.map((imageDto, index) =>
            //     this.productImageService.create(product.id, imageDto, images[index], tx)
            // );
            // await Promise.all(imagePromises);

            // 3. Return the complete product with relations
            return tx.product.findUnique({
                where: { id: product.id },
                include: { variants: { include: { prices: true, inventory: true } }, images: true }
            });
        });
    }

    async update(id: string, updateProductDto: UpdateProductDto) {
        return this.prisma.product.update({
            where: { id: id },
            data: {
                name: updateProductDto.name,
                slug: updateProductDto.slug,
                description: updateProductDto.description,
                status: updateProductDto.status,
                categoryId: updateProductDto.categoryId,
            }
        });
    }

    async remove(id: string) {
         return this.prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({
                where: { id: id },
                include: { images: true },
            });

            if (!product) {
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

            return { message: `Product with ID ${id} and its assets have been deleted.` };
        });
    }
}   
