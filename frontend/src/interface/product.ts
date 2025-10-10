import { Category } from "./category";
import { Subcategory } from "./subcategory";

export interface Product {
    results: number;
    metadata: Metadata;
    data: Daum[] | Daum;
}

export interface Metadata {
    currentPage: number;
    numberOfPages: number;
    limit: number;
    nextPage: number;
}

export interface Daum {
    sold?: number;
    images: string[];
    subcategory: Subcategory[];
    ratingsQuantity: number;
    _id: string;
    title: string;
    slug: string;
    description: string;
    quantity: number;
    price: number;
    imageCover: string;
    category: Category;
    brand: Category;
    ratingsAverage: number;
    createdAt: string;
    updatedAt: string;
    id: string;
    priceAfterDiscount?: number;
    availableColors?: unknown[];
}
