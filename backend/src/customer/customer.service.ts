import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
    CreateCustomerDto,
    AuthCustomerDto,
    UpdateCustomerDto
} from './dto';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import { Prisma } from '@prisma/client';
import { connect } from 'http2';

@Injectable()
export class CustomerService {
    constructor(
        private readonly prisma: PrismaService
    ) { }

    async create(dto: CreateCustomerDto) {
        if ((await this.prisma.customer.count({ where: { email: dto.email } })))
            throw new ConflictException('Email already exists');

        const { password, ...rest } = dto;
        const { provider, providerId,...restWithoutProvider } = rest;
        return this.prisma.customer.create({
            data: {
                ...restWithoutProvider,
                passwordHash: await argon2.hash(password),
                provider: provider as any, // TODO: Replace 'any' with 'PROVIDER' if we have the enum imported
            }
        });
    }

    async findByEmail(email: string) {
        return this.prisma.customer.findUnique({
            where: { email }
        });
    }

    async findById(id: string) {
        return this.prisma.customer.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
            }
        });
    }

    async findAll(
        page: number = 1,
        limit: number = 10,
        search: string = '',
        sort: string = 'name',
        order: 'asc' | 'desc' = 'asc',
    ) {
        const skip = (page - 1) * limit;
        const where: Prisma.CustomerWhereInput = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }
        
        const [total, customers] = await this.prisma.$transaction([
            this.prisma.customer.count({where}),
            this.prisma.customer.findMany({
                where: where,
                take: limit,
                skip: skip,
                orderBy: {
                    [sort]: order,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                }
            }),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            data: customers,
            meta: {
                total,
                totalPages,
            }
        }
    }

    async update(id: string, dto: UpdateCustomerDto) {
        if (!(await this.prisma.customer.count({ where: { id } })))
            throw new NotFoundException('Customer not found');

        const { provider, providerId, ...restWithoutProvider } = dto;
        return this.prisma.customer.update({
            where: { id },
            data: {
                ...restWithoutProvider,
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
            }
        });
    }
}
