import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCustomerDto, UpdateCustomerDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import { Prisma } from '@prisma/client';
import { LogService } from '../logger/log.service';
import { addDays } from '../utils';

@Injectable()
export class CustomerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LogService,
  ) {}

  async create(dto: CreateCustomerDto) {
    this.logger.debug(
      `Attempting to create customer with email: ${dto.email}`,
      CustomerService.name,
    );

    const existingCustomer = await this.prisma.customer.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (existingCustomer) {
      this.logger.warn(
        `Failed to create customer. Email already exists: ${dto.email}`,
        CustomerService.name,
      );
      throw new ConflictException('Email already exists');
    }

    try {
      const { password, ...rest } = dto;
      const { provider, providerId, ...restWithoutProvider } = rest;
      const newCustomer = await this.prisma.customer.create({
        data: {
          ...restWithoutProvider,
          passwordHash: await argon2.hash(password),
          provider: provider as any,
        },
      });
      this.logger.log(
        `Successfully created customer with ID: ${newCustomer.id}`,
        CustomerService.name,
      );
      return newCustomer;
    } catch (error) {
      this.logger.error(
        `Failed to create customer with email ${dto.email}`,
        error.stack,
        CustomerService.name,
      );
      throw error;
    }
  }

  async findByEmail(email: string) {
    this.logger.debug(
      `Finding customer by email: ${email}`,
      CustomerService.name,
    );
    const customer = await this.prisma.customer.findUnique({
      where: { email },
    });
    if (!customer) {
      this.logger.debug(
        `Customer with email ${email} not found.`,
        CustomerService.name,
      );
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
      },
    });
    if (!customer) {
      this.logger.warn(
        `Customer with ID ${id} not found.`,
        CustomerService.name,
      );
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
    this.logger.debug(
      `Finding all customers with query: page=${page}, limit=${limit}, search=${search}, sort=${sort}, order=${order}`,
      CustomerService.name,
    );
    const skip = (page - 1) * limit;
    const where: Prisma.CustomerWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, customers] = await this.prisma.$transaction([
      this.prisma.customer.count({ where }),
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
        },
      }),
    ]);
    const totalPages = Math.ceil(total / limit);
    return {
      data: customers,
      meta: {
        total,
        totalPages,
      },
    };
  }

  async update(id: string, dto: UpdateCustomerDto) {
    this.logger.debug(
      `Attempting to update customer ${id}`,
      CustomerService.name,
    );

    try {
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
        },
      });
      this.logger.log(
        `Successfully updated customer with ID: ${id}`,
        CustomerService.name,
      );
      return updatedCustomer;
    } catch (error) {
      if (error.code === 'P2025') {
        // Prisma error code for "Record not found"
        this.logger.warn(
          `Update failed: Customer with ID ${id} not found.`,
          CustomerService.name,
        );
        throw new NotFoundException('Customer not found');
      }
      throw error;
    }
  }

  async storeRefreshToken(
    customerId: string,
    hashedRefreshToken: string,
    device?: string | null,
    ip?: string | null,
  ) {
    this.logger.debug(
      `Storing refresh token for customer ID: ${customerId}`,
      CustomerService.name,
    );
    await this.prisma.customerRefreshToken.create({
      data: {
        customerId,
        tokenHash: hashedRefreshToken,
        device: device,
        ip: ip,
        expiresAt: addDays(new Date(), 7), // 7 days
      },
    });

    this.logger.log(
      `Refresh token stored for customer ID: ${customerId}`,
      CustomerService.name,
    );
  }

  async updateRefreshToken(customerId: string, hashedRefreshToken: string) {
    this.logger.debug(
      `Updating refresh token for customer ID: ${customerId}`,
      CustomerService.name,
    );
    await this.prisma.customerRefreshToken.updateMany({
      where: { customerId, isRevoked: false },
      data: {
        tokenHash: hashedRefreshToken,
        expiresAt: addDays(new Date(), 7), // 7 days
      },
    });

    this.logger.log(
      `Refresh token updated for customer ID: ${customerId}`,
      CustomerService.name,
    );
  }

  async findRefreshToken(tokenHash: string) {
    return this.prisma.customerRefreshToken.findFirst({
      where: {
        tokenHash,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        customer: {
          select: { id: true, email: true },
        },
      },
    });
  }

  async findRefreshTokensByCustomerId(customerId: string) {
    this.logger.debug(
      `Getting refresh tokens for customer ID: ${customerId}`,
      CustomerService.name,
    );
    return await this.prisma.customerRefreshToken.findMany({
      where: {
        customerId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      include: {
        customer: {
          select: { id: true, email: true },
        },
      },
    });
  }

  async revokeRefreshToken(id: string) {
    this.logger.debug(`Revoking refresh token ID: ${id}`, CustomerService.name);
    await this.prisma.customerRefreshToken.update({
      where: { id },
      data: {
        isRevoked: true,
      },
    });

    this.logger.log(
      `Refresh token ID: ${id} revoked successfully`,
      CustomerService.name,
    );
  }

  async revokeAllCustomerRefreshTokens(customerId: string) {
    this.logger.debug(
      `Revoking all refresh tokens for customer ID: ${customerId}`,
      CustomerService.name,
    );
    await this.prisma.customerRefreshToken.updateMany({
      where: { customerId, isRevoked: false },
      data: { isRevoked: true },
    });
    this.logger.log(
      `All refresh tokens revoked for customer ID: ${customerId}`,
      CustomerService.name,
    );
  }

  async cleanupExpiredTokens() {
    this.logger.debug(
      `Cleaning up expired refresh tokens`,
      CustomerService.name,
    );
    const result = await this.prisma.customerRefreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isRevoked: true, createdAt: { lt: addDays(new Date(), -30) } }, // Delete revoked tokens older than 30 days
        ],
      },
    });
    this.logger.log(
      `Cleaned up ${result.count} expired refresh tokens`,
      CustomerService.name,
    );
  }

  async storePasswordResetToken(customerId: string, token: string) {
    this.logger.debug(
      `Storing password reset token for customer ID: ${customerId}`,
      CustomerService.name,
    );

    await this.prisma.passwordResetToken.create({
      data: {
        customerId,
        tokenHash: await argon2.hash(token),
        expiresAt: new Date(Date.now() + 300000), // 5 minutes
      },
    });
  }

  async invalidateAllCustomerResetTokens(customerId: string): Promise<void> {
    this.logger.debug(
      `Invalidating all reset tokens for customer ID: ${customerId}`,
      CustomerService.name,
    );
    await this.prisma.passwordResetToken.deleteMany({
      where: { customerId },
    });
  }

  async findPasswordResetToken(token: string) {
    const allTokens = await this.prisma.passwordResetToken.findMany({
      where: {
        expiresAt: { gt: new Date() },
      },
    });

    for (const tokenRecord of allTokens) {
      if (await argon2.verify(tokenRecord.tokenHash, token)) {
        return tokenRecord;
      }
    }

    return null;
  }

  async invalidatePasswordResetToken(tokenId: string): Promise<void> {
    await this.prisma.passwordResetToken.delete({
      where: { id: tokenId },
    });
  }

  async updatePassword(customerId: string, newPassword: string): Promise<void> {
    await this.prisma.customer.update({
      where: { id: customerId },
      data: { passwordHash: await argon2.hash(newPassword) },
    });
  }
}
