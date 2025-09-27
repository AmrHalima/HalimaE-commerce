import { ForbiddenException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductVariantDto, ResponseVariantDto, UpdateVariantDto } from './dto';
import { Prisma } from '@prisma/client';
import { LogService } from '../logger/log.service';

@Injectable()
export class ProductVariantService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: LogService,
    ) { }
    
    async create(productId: string, variantDto: ProductVariantDto, tx: Prisma.TransactionClient = this.prisma): Promise<ResponseVariantDto> {
        this.logger.debug(`Creating variant for product ${productId} with DTO: ${JSON.stringify(variantDto)}`, ProductVariantService.name);
        
        if (!variantDto || !Array.isArray(variantDto.prices) || variantDto.prices.length === 0) {
            this.logger.warn(`Attempted to create variant for product ${productId} without prices.`, ProductVariantService.name);
            throw new BadRequestException('Variant must include at least one price');
        }
        try {
            const newVariant = await tx.productVariant.create({
                data: {
                    sku: variantDto.sku,
                    size: variantDto.size,
                    color: variantDto.color,
                    material: variantDto.material,
                    isActive: variantDto.isActive ?? true,
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
                },
                include: {
                    prices: {
                        select: {
                            id: true,
                            currency: true,
                            amount: true,
                            compareAt: true,
                        },
                    },
                    inventory: { select: { id: true, stockOnHand: true }}
                }
            });
            this.logger.log(`Successfully created variant ${newVariant.id} for product ${productId}`, ProductVariantService.name);
            return newVariant;
        } catch (error) {
            this.logger.error(`Failed to create variant for product ${productId}.`, error.stack, ProductVariantService.name);
            throw error;
        }
     }

    async update(productId: string, id: string, variantDto: UpdateVariantDto, tx: Prisma.TransactionClient = this.prisma): Promise<ResponseVariantDto> {
        this.logger.debug(`Updating variant ${id} for product ${productId} with DTO: ${JSON.stringify(variantDto)}`, ProductVariantService.name);
        const variant = await tx.productVariant.findUnique({
            where: { id },
            select: { productId: true, prices: { select: {id: true}} },
        });

        if (!variant) {
            this.logger.warn(`Update failed: Variant with ID ${id} not found.`, ProductVariantService.name);
            throw new NotFoundException(`Variant with ID ${id} not found`);
        }
        
        if (variant.productId !== productId) {
            this.logger.warn(`Forbidden: Attempt to update variant ${id} which does not belong to product ${productId}.`, ProductVariantService.name);
            throw new ForbiddenException(`Variant with ID ${id} does not belong to product with ID ${productId}`);
        }


        // TODO: handel prices update and on delivary update inventory
        const updatedVariant = await tx.productVariant.update({
            where: { id },
            data: {
                sku: variantDto.sku,
                size: variantDto.size,
                material: variantDto.material,
                color: variantDto.color,
                isActive: variantDto.isActive ?? true,
                prices: {
                    upsert: variantDto.prices?.map(price => ({
                        where: { id: price.id },
                        update: {
                            ...(price.currency && { currency: price.currency }),
                            ...(price.amount && { amount: price.amount }),
                            ...(price.compareAt !== undefined && { compareAt: price.compareAt }),
                        },
                        create: {
                            currency: price.currency!, // required
                            amount: price.amount!,
                            compareAt: price.compareAt ?? null,
                        },
                    })),
                },
                inventory: variantDto.inventory
                ? { upsert: {
                        update: { stockOnHand: variantDto.inventory.stockOnHand },
                        create: { stockOnHand: variantDto.inventory.stockOnHand },
                    }
                  }
                : undefined
            },
            include: {
                prices: { select: { id: true, compareAt: true, amount: true, currency: true }},
                inventory: {
                    select: {
                        id: true,
                        stockOnHand: true,
                    }
                }
            },
        });
        this.logger.log(`Successfully updated variant ${id} for product ${productId}`, ProductVariantService.name);
        return updatedVariant;
    }

    async getVariantsByProductId(productId: string): Promise<ResponseVariantDto[]> {
        this.logger.debug(`Fetching all variants for product ID: ${productId}`, ProductVariantService.name);
        const variants = await this.prisma.productVariant.findMany({
            where: { productId },
            select: {
                productId: true,
                prices: { select: { id: true, compareAt: true, amount: true, currency: true }}, 
                id: true,
                sku: true,
                color: true,
                material: true,
                isActive: true,
                inventory: { select: { id: true, stockOnHand: true, }}, 
            }
        });

        if (!variants) {
            this.logger.warn(`product with id ${productId} has no variants`, ProductVariantService.name);
            throw new NotFoundException(`product with id ${productId} has no variants`);
        }
        

        // return variants; // todo : solve this issue
        return variants;
    }

    

    async delete(productId: string, id: string, tx: Prisma.TransactionClient = this.prisma): Promise<void> {
        this.logger.debug(`Attempting to delete variant ${id} from product ${productId}`, ProductVariantService.name);
        const variant = await tx.productVariant.findUnique({
            where: { id },
            select: { productId: true }
        });

        if (!variant) {
            this.logger.warn(`Delete failed: Variant with ID ${id} not found.`, ProductVariantService.name);
            throw new NotFoundException(`Variant with ID ${id} not found`);
        }
        
        if (variant.productId !== productId) {
            this.logger.warn(`Forbidden: Attempt to delete variant ${id} which does not belong to product ${productId}.`, ProductVariantService.name);
            throw new ForbiddenException(`Variant with ID ${id} does not belong to product with ID ${productId}`);
        }

        await tx.variantPrice.deleteMany({ where: { variantId: id } });
        await tx.variantInventory.deleteMany({ where: { variantId: id } });

        await tx.productVariant.delete({ where: { id } });
        this.logger.log(`Successfully deleted variant ${id} from product ${productId}`, ProductVariantService.name);
    }
}
