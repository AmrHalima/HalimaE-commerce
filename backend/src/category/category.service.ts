import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
    CreateCategoryDto,
    UpdateCategoryDto,
    ResponseCategoryDto,
    ResponseCategoriesFilteredDto
} from './dto';
import { LogService } from '../logger/log.service';

@Injectable()
export class CategoryService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: LogService,
    ) { }

    async getAllPagenated(
        page: number            = 1,
        limit: number           = 10,
        orderBy: string         = 'name',
        orderDirection: string  = 'asc',
        search?: string
    ): Promise<ResponseCategoriesFilteredDto> {
        const where = search ? {
            name: {
                contains: search,
                mode: 'insensitive' as const, // Case-insensitive search
            }
        } : {};

        const [totalCategories, categories] = await this.prisma.$transaction([
            this.prisma.category.count({ where }),
            this.prisma.category.findMany({
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    [orderBy]: orderDirection
                },
                where,
                include: {
                    parent: true
                }
            }),
        ]);

        if (!categories) { 
            this.logger.warn(`No categories found`, CategoryService.name);
            throw new NotFoundException("No categories found");
        }

        const totalPages = Math.ceil(totalCategories / limit);

        return {
            categories: categories,
            meta: {
                totalCategories: totalCategories,
                totalPages: totalPages,
                currentPage: page,
            }
        };
    }

    async getById(id: string): Promise<ResponseCategoryDto> {
        const category = await this.prisma.category.findUnique({
            where: {
                id: id
            },
            include: {
                parent: true
            }
        });

        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }

        return category;
    }

    async getBySlug(slug: string): Promise<ResponseCategoryDto> {
        const category = await this.prisma.category.findUnique({
            where: {
                slug: slug
            },
            include: {
                parent: true
            }
        });

        if (!category) {
            throw new NotFoundException(`Category with slug ${slug} not found`);
        }

        return category;
    }

    async create(dto: CreateCategoryDto): Promise<ResponseCategoryDto> {
        if (dto.parentId) {
            const parentExists = await this.prisma.category.findUnique({ where: { id: dto.parentId } });
            if (!parentExists) {
                throw new BadRequestException(`Parent category with ID ${dto.parentId} does not exist.`);
            }
        }

        const category = await this.prisma.category.create({
            data: {
                name: dto.name,
                slug: dto.slug,
                parent: dto.parentId ? {
                    connect: {
                        id: dto.parentId
                    }
                } : undefined
            }
        });

        return category;
    }

    async update(id: string, dto: UpdateCategoryDto): Promise<ResponseCategoryDto> {
        if (dto.parentId) {
            if (id === dto.parentId) {
                throw new BadRequestException('A category cannot be its own parent.');
            }
            const parentExists = await this.prisma.category.findUnique({ where: { id: dto.parentId } });
            if (!parentExists) {
                throw new BadRequestException(`Parent category with ID ${dto.parentId} does not exist.`);
            }
        }

        const updatedCategory = await this.prisma.category.update({
            where: {
                id: id
            },
            data: {
                name: dto.name,
                slug: dto.slug,
                parent: dto.parentId ? {
                    connect: {
                        id: dto.parentId
                    }
                } : (dto.parentId === null ? { disconnect: true } : undefined)
            }
        });

        return updatedCategory;
    }

    async delete(id: string): Promise<void> {
        const category = await this.prisma.category.findUnique({ where: { id } });
        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }

        const subCategories = await this.prisma.category.findMany({ where: { parentId: id } });
        if (subCategories.length > 0) {
            throw new BadRequestException('Cannot delete category with subcategories');
        }

        await this.prisma.category.delete({
            where: { id: id },
        });
    }
}
