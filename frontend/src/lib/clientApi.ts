/**
 * Client-side API functions for infinite scroll
 * Fetches products from the client without server-side caching
 */

import { ProductsResponse } from "@/interface";

const BASE_URL = process.env.NEXT_PUBLIC_BE_BASE_URL || "http://localhost:3000";

export async function fetchProductsClient(params: {
    page: number;
    limit?: number;
    categoryId?: string;
    search?: string;
    priceMin?: number;
    priceMax?: number;
}): Promise<ProductsResponse> {
    const searchParams = new URLSearchParams();

    searchParams.append("page", params.page.toString());
    searchParams.append("limit", (params.limit || 10).toString());
    searchParams.append("status", "ACTIVE"); // Only show active products
    if (params.categoryId) searchParams.append("categoryId", params.categoryId);
    if (params.search) searchParams.append("name", params.search); // Backend expects 'name' not 'search'
    if (params.priceMin !== undefined)
        searchParams.append("priceMin", params.priceMin.toString());
    if (params.priceMax !== undefined)
        searchParams.append("priceMax", params.priceMax.toString());

    const url = `${BASE_URL}/api/products?${searchParams.toString()}`;

    const res = await fetch(url, {
        cache: "no-store", // No caching for client-side requests
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch products: ${res.status}`);
    }

    return res.json();
}
