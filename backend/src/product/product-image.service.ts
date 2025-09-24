import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductImageDto } from './dto';
import { Prisma } from '@prisma/client';
import { UPLOAD_DIR_PRODUCTS, TEMP_PATH } from './config/multer.config';
import sharp from 'sharp';
import { promises as fs, existsSync, rmSync, PathLike } from 'fs';
import { basename, join } from 'path';
import { randomUUID } from 'crypto';
import { LogService } from '../logger/log.service';

type AllowedFormat = 'jpeg' | 'png' | 'webp';

@Injectable()
export class ProductImageService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: LogService,
    ) { }

    async createMany(
        productId: string,
        productImageDto: ProductImageDto[],
        images: Array<Express.Multer.File>,
    ) {
        this.logger.debug(`Creating ${images.length} images for product ID: ${productId}`, ProductImageService.name);
        const imageCreationPromises = images.map(async (image, index) => {
            let tempFileName: string | null = null;
            try {
                // 1. Process and save image to a temporary location
                tempFileName = await this.processImage(image);
                const finalPath = join(UPLOAD_DIR_PRODUCTS, tempFileName);
                const tempFilePath = join(TEMP_PATH, tempFileName);
 
                // 2. Move image from temp to final destination
                await fs.rename(tempFilePath, finalPath);
 
                // 3. Create database entry
                const dto = productImageDto[index];
                return await this.prisma.productImage.create({
                    data: {
                        productId,
                        url: `/images/products/${tempFileName}`,
                        alt: dto?.alt ?? null,
                        sort: dto?.sort ?? index,
                    },
                });
            } catch (error) {
                // If anything fails, attempt to clean up the created temp file
                if (tempFileName) {
                    this.logger.error(`Error during image creation for product ${productId}. Cleaning up temp file: ${tempFileName}`, error.stack, ProductImageService.name);
                    const tempFilePath = join(TEMP_PATH, tempFileName);
                    if (existsSync(tempFilePath)) {
                        await fs.unlink(tempFilePath).catch(e => this.logger.error(`Failed to delete temp file: ${tempFilePath}`, e.stack, ProductImageService.name));
                    }
                }
                throw error; 
            }
        });
 
        const createdImages = await Promise.all(imageCreationPromises);
        this.logger.log(`Successfully created ${createdImages.length} images for product ${productId}`, ProductImageService.name);
        return createdImages;
    }

    async create(productId: string, productImageDto: ProductImageDto, image: Express.Multer.File, tx: Prisma.TransactionClient = this.prisma) {
        const createdImages = await this.createMany(productId, [productImageDto], [image]);
        return createdImages[0];
    }

    async delete(productId: string, id: string, tx: Prisma.TransactionClient = this.prisma): Promise<void> {
        this.logger.debug(`Attempting to delete image ${id} from product ${productId}`, ProductImageService.name);
        const image = await tx.productImage.findUnique({
            where: { id },
            select: { productId: true, url: true }
        });

        if (!image) {
            this.logger.warn(`Delete failed: Image with ID ${id} not found.`, ProductImageService.name);
            throw new NotFoundException(`Image with ID ${id} not found.`);
        }

        if (image.productId !== productId) {
            this.logger.warn(`Forbidden: Attempt to delete image ${id} which does not belong to product ${productId}.`, ProductImageService.name);
            throw new ForbiddenException('You are not allowed to delete this image.');
        }

        // image.url is like '/images/products/filename.ext'
        const filePath = join(UPLOAD_DIR_PRODUCTS, basename(image.url));

        if (existsSync(filePath)) {
            this.logger.debug(`Deleting image file: ${filePath}`, ProductImageService.name);
            rmSync(filePath);
        }

        await tx.productImage.delete({
            where: { id },
        });
        this.logger.log(`Successfully deleted image ${id} from product ${productId}`, ProductImageService.name);
    }

    async metaDataupdate(id: string, productImageDto: Partial<ProductImageDto>, tx: Prisma.TransactionClient = this.prisma) {
        this.logger.debug(`Updating metadata for image ${id} with DTO: ${JSON.stringify(productImageDto)}`, ProductImageService.name);
        return tx.productImage.update({
            where: { id },
            data: {
                ...productImageDto
            }
        });
        this.logger.log(`Successfully updated metadata for image ${id}`, ProductImageService.name);
    }

    async getImagesByProductId(productId: string, tx: Prisma.TransactionClient = this.prisma) {
        this.logger.debug(`Fetching all images for product ID: ${productId}`, ProductImageService.name);
        return tx.productImage.findMany({
            where: { productId },
            include: { product: true }

        });
    }

    async replace(productId: string, id: string, newFile: Express.Multer.File, tx: Prisma.TransactionClient = this.prisma) {
        this.logger.debug(`Replacing image ${id} for product ${productId}`, ProductImageService.name);
        const image = await tx.productImage.findUnique({
            where: { id },
            select: {
                id: true,
                url: true,
                productId: true
            }
        });

        if (!image) {
            this.logger.warn(`Replace failed: Image with ID ${id} not found.`, ProductImageService.name);
            throw new NotFoundException(`Image with ID ${id} not found.`);
        }

        if (image.productId !== productId) {
            this.logger.warn(`Forbidden: Attempt to replace image ${id} which does not belong to product ${productId}.`, ProductImageService.name);
            throw new ForbiddenException(`Image with ID ${id} does not belong to product with ID ${productId}`);
        }

        // 1. Delete the old file from the filesystem
        const oldFilePath = join(UPLOAD_DIR_PRODUCTS, basename(image.url));
        this.logger.debug(`Deleting old image file: ${oldFilePath}`, ProductImageService.name);
        if (existsSync(oldFilePath)) {
            rmSync(oldFilePath);
        }

        // 2. Process the new file buffer and save it
        const newFileName = await this.processImage(newFile);
        const finalPath = join(UPLOAD_DIR_PRODUCTS, newFileName);
        const tempFilePath = join(TEMP_PATH, newFileName);
        await fs.rename(tempFilePath, finalPath);

        // 3. Update the database record with the new file's URL
        const newImageUrl = `/images/products/${newFileName}`;
        const updatedImage = await tx.productImage.update({
            where: { id },
            data: { url: newImageUrl }
        });
        this.logger.log(`Successfully replaced image ${id} for product ${productId}. New URL: ${newImageUrl}`, ProductImageService.name);
        return updatedImage;
    }

    private async processImage(image: Express.Multer.File) {
        this.logger.debug(`Processing image: ${image.originalname} (${(image.size / 1024).toFixed(2)} KB)`, ProductImageService.name);
        const sharpInstance = sharp(image.buffer);
        const metadata = await sharpInstance.metadata();
        const metaFormat = metadata.format;
        if (!['jpeg', 'png', 'webp'].includes(metaFormat)) {
            this.logger.error(`Unsupported file type uploaded: ${metaFormat}`, undefined, ProductImageService.name);
            throw new BadRequestException('Unsupported file type');
        }
        const safeFormat = metaFormat as AllowedFormat;
        const ext = (safeFormat === 'jpeg') ? 'jpg' : safeFormat;
        const fileName = `${Date.now()}-${randomUUID()}.${ext}`;
        const tempFilePath = join(TEMP_PATH, fileName);
        // re-encode (sanitizes metadata)
        await (sharpInstance)[safeFormat]({ quality: 90 }).toFile(tempFilePath);
        this.logger.debug(`Image processed and saved to temp location: ${tempFilePath}`, ProductImageService.name);
        return fileName;
    }
}
