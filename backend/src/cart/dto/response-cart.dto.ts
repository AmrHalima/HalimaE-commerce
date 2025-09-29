import { Decimal } from '@prisma/client/runtime/library';

export class CartItemResponseDto {
    id: string;
    qty: number;
    variant: {
        id: string;
        sku: string;
        size?: string;
        color?: string;
        material?: string;
        product: {
            id: string;
            name: string;
            slug: string;
            images: Array<{
                url: string;
                alt?: string;
            }>;
        };
        prices: Array<{
            id: string;
            amount: Decimal;
            currency: string;
            compareAt?: Decimal | null;
        }>;
    };
}

export class CartResponseDto {
    id: string;
    customerId: string;
    createdAt: Date;
    updatedAt: Date;
    items: CartItemResponseDto[];
    totalItems: number;
    estimatedTotal?: number; // Optional calculated field
}

// Lightweight checkout DTO - only essential data
export class CheckoutCartDto {
    id: string;
    customerId: string;
    items: Array<{
        id: string;
        qty: number;
        variant: {
            id: string;
            sku: string;
            product: {
                name: string; // For order snapshot
            };
            prices: Array<{
                amount: Decimal;
                currency: string;
            }>;
        };
    }>;
    totalItems: number;
}
