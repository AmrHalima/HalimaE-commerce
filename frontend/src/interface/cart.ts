import { Category } from "./category";
import { Subcategory } from "./subcategory";

export interface Cart {
    message?: string;
    status: string;
    numOfCartItems: number;
    cartId: string;
    data: Data;
}

export interface Data {
    _id: string;
    cartOwner: string;
    products: Item[];
    createdAt: string;
    updatedAt: string;
    __v: number;
    totalCartPrice: number;
}

export interface Item {
    count: number;
    _id: string;
    product: Product; // No longer needs to be a string
    price: number;
}

export interface Product {
    subcategory: Subcategory[];
    _id: string;
    title: string;
    quantity: number;
    imageCover: string;
    category: Category;
    brand: Category;
    ratingsAverage: number;
    id: string;
}
