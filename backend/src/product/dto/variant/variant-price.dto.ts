import { Prisma } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDecimal, IsOptional, IsString } from 'class-validator';

export class VariantPriceDto {
    @IsString()
    readonly currency: string;

    @IsDecimal()
    readonly amount: Prisma.Decimal;

    @IsOptional()
    @IsDecimal()
    readonly compareAt?: Prisma.Decimal | null;
}