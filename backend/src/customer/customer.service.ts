import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
    CreateCustomerDto,
    UpdateCustomerDto
} from './dto';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import { Prisma } from '@prisma/client';
import { LogService } from '../logger/log.service';

@Injectable()
export class CustomerService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: LogService,
    ) { }

    async create(dto: CreateCustomerDto) {
        this.logger.debug(`Attempting to create customer with email: ${dto.email}`, CustomerService.name);
        if ((await this.prisma.customer.count({ where: { email: dto.email } }))) {
            this.logger.warn(`Failed to create customer. Email already exists: ${dto.email}`, CustomerService.name);
            throw new ConflictException('Email already exists');
        }

        try {
            const { password, ...rest } = dto;
            const { provider, providerId,...restWithoutProvider } = rest;
            const newCustomer = await this.prisma.customer.create({
                data: {
                    ...restWithoutProvider,
                    passwordHash: await argon2.hash(password),
                    provider: provider as any, // TODO: Replace 'any' with 'PROVIDER' if we have the enum imported
                }
            });
            this.logger.log(`Successfully created customer with ID: ${newCustomer.id}`, CustomerService.name);
            return newCustomer;
        } catch (error) {
            this.logger.error(`Failed to create customer with email ${dto.email}`, error.stack, CustomerService.name);
            throw error;
        }
    }

    async findByEmail(email: string) {
        this.logger.debug(`Finding customer by email: ${email}`, CustomerService.name);
        const customer = await this.prisma.customer.findUnique({
            where: { email }
        });
        if (!customer) {
            this.logger.debug(`Customer with email ${email} not found.`, CustomerService.name);
        }
        return customer;
    }

    async findById(id: string) {
        this.logger.debug(`Finding customer by ID: ${id}`, CustomerService.name);
        const customer = await this.prisma.customer.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
            }
        });
        if (!customer) {
            this.logger.warn(`Customer with ID ${id} not found.`, CustomerService.name);
        }
        return customer;
    }

    async findAll(
        page: number = 1,
        limit: number = 10,
        search: string = '',
        sort: string = 'name',
        order: 'asc' | 'desc' = 'asc',
    ) {
        this.logger.debug(`Finding all customers with query: page=${page}, limit=${limit}, search=${search}, sort=${sort}, order=${order}`, CustomerService.name);
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
        this.logger.debug(`Attempting to update customer ${id} with DTO: ${JSON.stringify(dto)}`, CustomerService.name);
        if (!(await this.prisma.customer.count({ where: { id } }))) {
            this.logger.warn(`Update failed: Customer with ID ${id} not found.`, CustomerService.name);
            throw new NotFoundException('Customer not found');
        }

        const { provider, providerId, ...restWithoutProvider } = dto;
        const updatedCustomer = await this.prisma.customer.update({
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
        this.logger.log(`Successfully updated customer with ID: ${id}`, CustomerService.name);
        return updatedCustomer;
    }
}
