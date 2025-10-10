import { Category } from "./category";
import { Subcategory } from "./subcategory";

export default interface WishlistResponse {
    status: string;
    count: number;
    data: WishlistItem[];
}

export interface WishlistItem {
    sold: number;
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
    __v: number;
    id: string;
}
