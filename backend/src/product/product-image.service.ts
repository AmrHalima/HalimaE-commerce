import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductImageDto } from './dto';
import { Prisma } from '@prisma/client';
import { UPLOAD_DIR, TEMP_PATH } from './config/multer.config';
import sharp from 'sharp';
import { promises as fs, existsSync, rmSync, PathLike } from 'fs';
import { basename, join } from 'path';
import { randomUUID } from 'crypto';

type AllowedFormat = 'jpeg' | 'png' | 'webp';

@Injectable()
export class ProductImageService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async createMany(
        productId: string,
        productImageDto: ProductImageDto[],
        images: Array<Express.Multer.File>,
    ) {
        const imageCreationPromises = images.map(async (image, index) => {
            let tempFileName: string | null = null;
            try {
                // 1. Process and save image to a temporary location
                tempFileName = await this.processImage(image);
                const finalPath = join(UPLOAD_DIR, tempFileName);
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
                    const tempFilePath = join(TEMP_PATH, tempFileName);
                    if (existsSync(tempFilePath)) {
                        await fs.unlink(tempFilePath).catch(e => console.error(`Failed to delete temp file: ${tempFilePath}`, e));
                    }
                }
                throw error; 
            }
        });
 
        return Promise.all(imageCreationPromises);
    }

    async create(productId: string, productImageDto: ProductImageDto, image: Express.Multer.File, tx: Prisma.TransactionClient = this.prisma) {
        const createdImages = await this.createMany(productId, [productImageDto], [image]);
        return createdImages[0];
    }

    async delete(productId: string, id: string, tx: Prisma.TransactionClient = this.prisma) {
        const image = await tx.productImage.findUnique({
            where: { id },
            select: { productId: true, url: true }
        });

        if (!image) {
            throw new NotFoundException(`Image with ID ${id} not found.`);
        }

        if (image.productId !== productId) {
            throw new ForbiddenException('You are not allowed to delete this image.');
        }

        // image.url is like '/images/products/filename.ext'
        const filePath = join(UPLOAD_DIR, basename(image.url));

        if (existsSync(filePath)) {
            rmSync(filePath);
        }

        return tx.productImage.delete({
            where: { id },
        });
    }

    async metaDataupdate(id: string, productImageDto: Partial<ProductImageDto>, tx: Prisma.TransactionClient = this.prisma) {
        return tx.productImage.update({
            where: { id },
            data: {
                ...productImageDto
            }
        });
    }

    async getImagesByProductId(productId: string, tx: Prisma.TransactionClient = this.prisma) {
        return tx.productImage.findMany({
            where: { productId },
            include: { product: true }

        });
    }

    async replace(productId: string, id: string, newFile: Express.Multer.File, tx: Prisma.TransactionClient = this.prisma) {
        const image = await tx.productImage.findUnique({
            where: { id },
            select: {
                id: true,
                url: true,
                productId: true
            }
        });

        if (!image) {
            throw new NotFoundException(`Image with ID ${id} not found.`);
        }

        if (image.productId !== productId) {
            throw new ForbiddenException(`Image with ID ${id} does not belong to product with ID ${productId}`);
        }

        // 1. Delete the old file from the filesystem
        const oldFilePath = join(UPLOAD_DIR, basename(image.url));
        if (existsSync(oldFilePath)) {
            rmSync(oldFilePath);
        }

        // 2. Process the new file buffer and save it
        const newFileName = await this.processImage(newFile);
        const finalPath = join(UPLOAD_DIR, newFileName);
        const tempFilePath = join(TEMP_PATH, newFileName);
        await fs.rename(tempFilePath, finalPath);

        // 3. Update the database record with the new file's URL
        const newImageUrl = `/images/products/${newFileName}`;
        return tx.productImage.update({
            where: { id },
            data: { url: newImageUrl }
        });
    }

    private async processImage(image: Express.Multer.File) {
        const sharpInstance = sharp(image.buffer);
        const metadata = await sharpInstance.metadata();
        const metaFormat = metadata.format;
        if (!['jpeg', 'png', 'webp'].includes(metaFormat)) {
            throw new BadRequestException('Unsupported file type');
        }
        const safeFormat = metaFormat as AllowedFormat;
        const ext = (safeFormat === 'jpeg') ? 'jpg' : safeFormat;
        const fileName = `${Date.now()}-${randomUUID()}.${ext}`;
        const tempFilePath = join(TEMP_PATH, fileName);
        // re-encode (sanitizes metadata)
        await (sharpInstance)[safeFormat]({ quality: 90 }).toFile(tempFilePath);
        return fileName;
    }
}
