import { ForbiddenException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductVariantDto, CreateProductDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductVariantService {
    constructor(
        private readonly prisma: PrismaService
    ) { }
    
    async create(productId: string, variantDto: ProductVariantDto, tx: Prisma.TransactionClient = this.prisma) {
        if (!variantDto || !Array.isArray(variantDto.prices) || variantDto.prices.length === 0) {
            throw new BadRequestException('Variant must include at least one price');
        }
         return tx.productVariant.create({
             data: {
                 sku: variantDto.sku,
                 size: variantDto.size,
                 color: variantDto.color,
                 material: variantDto.material,
                 isActive: variantDto.isActive,
                 product: {
                     connect: { id: productId }
                 },
                 prices: {
                     create: variantDto.prices.map((price) => ({
                         currency: price.currency,
                         amount: price.amount,
                         compareAt: price.compareAt,
                     })),
                 },
                 inventory: (variantDto.inventory && variantDto.inventory.stockOnHand !== null && variantDto.inventory.stockOnHand !== undefined) ? {
                     create: {
                         stockOnHand: variantDto.inventory.stockOnHand,
                     },
                 } : undefined,
             }
         });
     }

    async update(productId: string, id: string, variantDto: Partial<ProductVariantDto>, tx: Prisma.TransactionClient = this.prisma) {
        const variant = await tx.productVariant.findUnique({
            where: { id },
            select: { productId: true },
        });

        if (!variant) {
            throw new NotFoundException(`Variant with ID ${id} not found`);
        }
        
        if (variant.productId !== productId) {
            throw new ForbiddenException(`Variant with ID ${id} does not belong to product with ID ${productId}`);
        }

        return tx.productVariant.update({
            where: { id },
            data: {
                sku: variantDto.sku,
                size: variantDto.size,
                color: variantDto.color,
                material: variantDto.material,
                isActive: variantDto.isActive,
            }
        });
    }

    async getVariantsByProductId(productId: string) {
        return this.prisma.productVariant.findMany({
            where: { productId },
            include: { prices: true, inventory: true },
        });
    }

    async delete(productId: string, id: string, tx: Prisma.TransactionClient = this.prisma) {
        const variant = await tx.productVariant.findUnique({
            where: { id },
            select: { productId: true }
        });

        if (!variant) {
            throw new NotFoundException(`Variant with ID ${id} not found`);
        }
        
        if (variant.productId !== productId) {
            throw new ForbiddenException(`Variant with ID ${id} does not belong to product with ID ${productId}`);
        }

        await tx.variantPrice.deleteMany({ where: { variantId: id } });
        await tx.variantInventory.deleteMany({ where: { variantId: id } });

        return tx.productVariant.delete({ where: { id } });
    }
}
