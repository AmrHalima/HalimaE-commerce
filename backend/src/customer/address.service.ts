import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto, UpdateAddressDto } from './dto';

@Injectable()
export class AddressService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async findById(customerId: string, id: string) {
        if (! (await this.prisma.address.count({where: {id, customerId}})) )
            throw new NotFoundException('Address not found');

        return this.prisma.address.findUnique({
            where: { id },
        });
    }
            

    // TODO: CREATE RESPONSE DTO
    async findAll(customerId: string) {
        const addresses = await this.prisma.address.findMany({
            where: { customerId },
        });

        if (!addresses)
            throw new NotFoundException('Addresses not found');

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
        if (! (await this.prisma.address.count({where: {id, customerId}})) )
            throw new NotFoundException('Address not found');

        const updated = await this.prisma.address.update({
            where: { id },
            data: {
                ...updateAddressDto
            },
        });

        return updated;
    }

    async delete(customerId: string, id: string) {
        if (! (await this.prisma.address.count({where: {id, customerId}})) )
            throw new NotFoundException('Address not found');

        await this.prisma.address.delete({
            where: { id },
        });

        return true;
    }
}
