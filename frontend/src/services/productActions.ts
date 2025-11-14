"use server";

import {
    Product,
    ProductsResponse,
    Variant,
    ImageItem,
    ProductStatus,
} from "@/interface";
import { getBackendAccessToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL || "http://localhost:3000";
const MANAGEMENT_PRODUCTS_PATH = "/management/products";

export type ProductFilters = {
    categoryId?: string;
    status?: ProductStatus;
    page?: number;
    priceMin?: number;
    priceMax?: number;
    search?: string;
};

export type CreateProductData = {
    name: string;
    description?: string;
    slug: string;
    status: ProductStatus;
    categoryId?: string;
    variants: Array<{
        sku: string;
        size?: string;
        color?: string;
        material?: string;
        isActive: boolean;
        prices: Array<{
            currency: string;
            amount: string;
            compareAt?: string;
        }>;
        inventory: {
            stockOnHand: number;
        };
    }>;
};

export type VariantPayload = {
    sku: string;
    size?: string;
    color?: string;
    material?: string;
    isActive: boolean;
    prices: Array<{
        currency: string;
        amount: string;
        compareAt?: string;
    }>;
    inventory?: {
        stockOnHand: number;
    };
};

const buildQueryString = (filters: ProductFilters) => {
    const params = new URLSearchParams();

    if (filters.categoryId) params.append("categoryId", filters.categoryId);
    if (filters.status) params.append("status", filters.status);
    if (typeof filters.page === "number")
        params.append("page", filters.page.toString());
    if (typeof filters.priceMin === "number")
        params.append("priceMin", filters.priceMin.toString());
    if (typeof filters.priceMax === "number")
        params.append("priceMax", filters.priceMax.toString());
    if (filters.search) params.append("name", filters.search); // Backend expects 'name' not 'search'

    const queryString = params.toString();
    return queryString ? `?${queryString}` : "";
};

const getAccessTokenOrThrow = async () => {
    const token = await getBackendAccessToken();
    if (!token) {
        throw new Error("Authentication required");
    }
    return token;
};

const parseJson = async <T>(res: Response) => {
    try {
        return (await res.json()) as T;
    } catch {
        return null;
    }
};

const ensureOk = async (res: Response, fallbackMessage: string) => {
    if (res.ok) {
        return;
    }
    const payload = await parseJson<{ message?: string }>(res);
    const message = payload?.message || fallbackMessage;
    throw new Error(message);
};

export const fetchProducts = async (
    filters: ProductFilters = {}
): Promise<ProductsResponse> => {
    const query = buildQueryString(filters);
    const url = `${API_URL}/api/products${query}`;

    const res = await fetch(url, {
        cache: "no-store",
    });
    await ensureOk(res, "Failed to load products");
    return (await res.json()) as ProductsResponse;
};

export const fetchProduct = async (id: string): Promise<Product> => {
    const res = await fetch(`${API_URL}/api/products/${id}`, {
        cache: "no-store",
    });
    await ensureOk(res, "Failed to load product");
    const payload = await res.json();
    return payload.data ?? payload;
};

export const createProduct = async (
    productData: CreateProductData
): Promise<Product> => {
    const token = await getAccessTokenOrThrow();
    const res = await fetch(`${API_URL}/api/products`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
    });
    await ensureOk(res, "Failed to create product");
    revalidatePath(MANAGEMENT_PRODUCTS_PATH);
    const payload = await res.json();
    return payload.data ?? payload;
};

export const updateProduct = async (
    id: string,
    productData: Partial<Product> | CreateProductData
): Promise<Product> => {
    const token = await getAccessTokenOrThrow();
    const res = await fetch(`${API_URL}/api/products/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
    });
    await ensureOk(res, "Failed to update product");
    revalidatePath(MANAGEMENT_PRODUCTS_PATH);
    const payload = await res.json();
    return payload.data ?? payload;
};

export const deleteProductById = async (id: string): Promise<void> => {
    const token = await getAccessTokenOrThrow();
    const res = await fetch(`${API_URL}/api/products/${id}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    await ensureOk(res, "Failed to delete product");
    revalidatePath(MANAGEMENT_PRODUCTS_PATH);
};

export const fetchProductImages = async (
    productId: string
): Promise<ImageItem[]> => {
    const res = await fetch(`${API_URL}/api/products/${productId}/images`, {
        cache: "no-store",
    });
    await ensureOk(res, "Failed to load product images");
    const payload = await res.json();
    const images = payload.data ?? payload.images ?? payload;
    return Array.isArray(images) ? images : [];
};

export const uploadProductImages = async (
    productId: string,
    formData: FormData
): Promise<ImageItem[]> => {
    const token = await getAccessTokenOrThrow();
    const res = await fetch(`${API_URL}/api/products/${productId}/images`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });
    await ensureOk(res, "Failed to upload images");
    revalidatePath(MANAGEMENT_PRODUCTS_PATH);
    const payload = await res.json();
    return payload.data ?? payload.images ?? payload;
};

export const deleteProductImage = async (
    productId: string,
    imageId: string
): Promise<void> => {
    const token = await getAccessTokenOrThrow();
    const res = await fetch(
        `${API_URL}/api/products/${productId}/images/${imageId}`,
        {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    await ensureOk(res, "Failed to delete image");
    revalidatePath(MANAGEMENT_PRODUCTS_PATH);
};

export const fetchProductVariants = async (
    productId: string
): Promise<Variant[]> => {
    const res = await fetch(`${API_URL}/api/products/${productId}/variants`, {
        cache: "no-store",
    });
    await ensureOk(res, "Failed to load variants");
    const payload = await res.json();
    const variants = payload.data ?? payload.variants ?? payload;
    return Array.isArray(variants) ? variants : [];
};

export const addProductVariant = async (
    productId: string,
    data: VariantPayload
): Promise<Variant> => {
    const token = await getAccessTokenOrThrow();
    const res = await fetch(`${API_URL}/api/products/${productId}/variants`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });
    await ensureOk(res, "Failed to add variant");
    revalidatePath(MANAGEMENT_PRODUCTS_PATH);
    const payload = await res.json();
    return payload.data ?? payload;
};

export const updateProductVariant = async (
    productId: string,
    variantId: string,
    data: VariantPayload
): Promise<Variant> => {
    const token = await getAccessTokenOrThrow();
    const url = `${API_URL}/api/products/${productId}/variants/${variantId}`;

    const res = await fetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });

    const responseJson = await res.json();

    if (!res.ok) {
        // Handle error responses with proper envelope structure
        const errorMessage =
            responseJson.error?.message ||
            responseJson.message ||
            "Failed to update variant";
        throw new Error(errorMessage);
    }

    revalidatePath(MANAGEMENT_PRODUCTS_PATH);

    // Return the data from the response envelope
    return responseJson.data ?? responseJson;
};

export const deleteProductVariant = async (
    productId: string,
    variantId: string
): Promise<void> => {
    const token = await getAccessTokenOrThrow();
    const res = await fetch(
        `${API_URL}/api/products/${productId}/variants/${variantId}`,
        {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    await ensureOk(res, "Failed to delete variant");
    revalidatePath(MANAGEMENT_PRODUCTS_PATH);
};
