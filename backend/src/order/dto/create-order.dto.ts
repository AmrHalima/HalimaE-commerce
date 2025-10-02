import { IsString, IsUUID, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({
    description: 'Billing address ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  billingAddressId: string;

  @ApiProperty({
    description: 'Shipping address ID',
    example: '123e4567-e89b-12d3-a456-426614174001'
  })
  @IsUUID()
  shippingAddressId: string;

  @ApiPropertyOptional({
    description: 'Currency code (defaults to EGP)',
    example: 'EGP',
    default: 'EGP'
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Payment method to use',
    example: 'CARD',
    enum: ['CARD', 'CASH', 'WALLET']
  })
  @IsOptional()
  @IsEnum(['CARD', 'CASH', 'WALLET'])
  paymentMethod?: string;
}
