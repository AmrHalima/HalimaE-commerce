import { IsOptional, IsEnum, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { FULFILLMENTSTATUS, ORDERSTATUS, PAYMENTSTATUS} from '@prisma/client';

export class FilterOrderDto {
  @ApiPropertyOptional({
    description: 'Order status filter',
    enum: ORDERSTATUS
  })
  @IsOptional()
  @IsEnum(ORDERSTATUS)
  status?: ORDERSTATUS;

  @ApiPropertyOptional({
    description: 'Payment status filter',
    enum: PAYMENTSTATUS
  })
  @IsOptional()
  @IsEnum(PAYMENTSTATUS)
  paymentStatus?: PAYMENTSTATUS;

  @ApiPropertyOptional({
    description: 'Fulfillment status filter',
    enum: FULFILLMENTSTATUS
  })
  @IsOptional()
  @IsEnum(FULFILLMENTSTATUS)
  fulfillmentStatus?: FULFILLMENTSTATUS;

  @ApiPropertyOptional({
    description: 'Page number',
    minimum: 1,
    default: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    minimum: 1,
    default: 10
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Search by order number',
    example: 'ORD-2025-001'
  })
  @IsOptional()
  @IsString()
  orderNo?: string;
}
