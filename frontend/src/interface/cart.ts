import { Product, Variant, PriceItem } from "./index";

// Cart API Response
export interface CartResponse {
    success: boolean;
    data: Cart;
    error: null;
    message: string;
    statusCode: number;
    timestamp: string;
}

// Cart structure
export interface Cart {
    id: string;
    customerId: string;
    createdAt: string;
    updatedAt: string;
    items: CartItem[];
    totalItems: number;
}

// Cart item with variant and product details
export interface CartItem {
    id: string; // cart item ID
    cartId: string;
    variantId: string;
    qty: number;
    variant: CartVariant;
}

// Variant with nested product
export interface CartVariant {
    id: string;
    productId: string;
    sku: string;
    size?: string | null;
    color?: string | null;
    material?: string | null;
    isActive: boolean;
    product: CartProduct;
    prices: PriceItem[];
}

// Product info in cart
export interface CartProduct {
    id: string;
    name: string;
    slug: string;
    images: Array<{
        id: string;
        url: string;
        alt: string | null;
    }>;
}
