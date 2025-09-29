import { IsUUID, IsInt, Min } from 'class-validator';

export class CreateCartDto {
    @IsUUID()
    customerId: string;
}

export class AddToCartDto {
    @IsUUID()
    variantId: string;

    @IsInt()
    @Min(1)
    qty: number;
}

export class UpdateCartItemDto {
    @IsInt()
    @Min(0) // Allow 0 to remove item
    qty: number;
}
