// enums / small types
type UUID = string;
type ISODateString = string;
type Currency = string;
type CurrencyAmount = string; // original JSON uses strings like "29" or "29.99"

export type ProductStatus = "ACTIVE" | "INACTIVE";

// leaf objects
export interface ImageItem {
    id: UUID;
    url: string;
    alt: string | null;
}

export interface Inventory {
    id: UUID;
    stockOnHand: number;
}

export interface PriceItem {
    id: UUID;
    compareAt: CurrencyAmount | null;
    amount: CurrencyAmount;
    currency: Currency;
}

export interface Variant {
    id: UUID;
    sku: string;
    size?: string | null;
    color?: string | null;
    material?: string | null;
    isActive: boolean;
    prices: PriceItem[];
    inventory?: Inventory | null;
}

// main product
export interface Product {
    id: UUID;
    name: string;
    slug: string;
    description?: string | null;
    status: ProductStatus;
    createdAt: ISODateString;
    updatedAt: ISODateString;
    deletedAt: ISODateString | null;
    categoryId?: UUID | null;
    images: ImageItem[];
    variants: Variant[];
}

// pagination meta
export interface ProductsMeta {
    totalPages: number;
    currentPage: number;
    totalProducts: number;
}

// top-level data container
export interface ProductsData {
    products: Product[];
    meta: ProductsMeta;
}

// full response
export interface ProductsResponse {
    success: true;
    data: ProductsData;
    error: null;
    message: string;
    statusCode: number;
    timestamp: ISODateString;
}
export interface Category {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    parent: Category | null;
}

export interface Meta {
    totalCategories: number;
    totalPages: number;
    currentPage: number;
}

export interface CategoriesData {
    categories: Category[];
    meta: Meta;
}

export interface CategoriesResponse {
    success: boolean;
    data: CategoriesData;
    error: string | null;
    message: string;
    statusCode: number;
    timestamp: string;
}
