import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto, UpdateAddressDto } from './dto';

@Injectable()
export class AddressService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async findById(customerId: string, id: string) {
        const address = await this.prisma.address.findFirst({
            where: { id, customerId },
        });

        if (!address) {
            throw new NotFoundException('Address not found');
        }

        return address;
    }

    async findAll(customerId: string) {
        const addresses = await this.prisma.address.findMany({
            where: { customerId },
            orderBy: { isDefault: 'desc' }, // Show default address first
        });

        return addresses;
    }

    async create(customerId: string, createAddressDto: CreateAddressDto) {
        return this.prisma.address.create({
            data: {
                customerId,
                ...createAddressDto
            },
        });
    }

    async update(customerId: string, id: string, updateAddressDto: UpdateAddressDto) {
        try {
            const updated = await this.prisma.address.updateMany({
                where: { id, customerId }, // Ensure address belongs to customer
                data: {
                    ...updateAddressDto
                },
            });

            if (updated.count === 0) {
                throw new NotFoundException('Address not found');
            }

            // Return the updated address
            return this.prisma.address.findUnique({
                where: { id },
            });
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw error;
        }
    }

    async delete(customerId: string, id: string) {
        try {
            const deleted = await this.prisma.address.deleteMany({
                where: { id, customerId }, // Ensure address belongs to customer
            });

            if (deleted.count === 0) {
                throw new NotFoundException('Address not found');
            }

            return { message: 'Address deleted successfully' };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw error;
        }
    }
}
