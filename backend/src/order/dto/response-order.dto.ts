import { ApiProperty } from '@nestjs/swagger';
import { FULFILLMENTSTATUS, ORDERSTATUS, PAYMENTSTATUS, Prisma } from '@prisma/client';

class OrderItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  variantId: string;

  @ApiProperty()
  nameSnapshot: string;

  @ApiProperty()
  skuSnapshot: string;

  @ApiProperty()
  unitPrice: Prisma.Decimal;

  @ApiProperty()
  qty: number;
}

class AddressSnapshotDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  line1: string;

  @ApiProperty({ required: false })
  line2?: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  country: string;

  @ApiProperty()
  postalCode: string;
}

export class ResponseOrderDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderNo: string;

  @ApiProperty()
  customerId: string;

  @ApiProperty()
  currency: string;

  @ApiProperty({ enum: ORDERSTATUS })
  status: ORDERSTATUS;

  @ApiProperty({ enum: PAYMENTSTATUS })
  paymentStatus: PAYMENTSTATUS;

  @ApiProperty({ enum: FULFILLMENTSTATUS })
  fulfillmentStatus: FULFILLMENTSTATUS;

  @ApiProperty()
  billingAddress: AddressSnapshotDto;

  @ApiProperty()
  shippingAddress: AddressSnapshotDto;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];

  @ApiProperty()
  placedAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  deletedAt?: Date;

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  total: number;
}
