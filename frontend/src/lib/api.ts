/**
 * API Layer - Server-side data fetching with caching and normalization
 * Uses Next.js fetch with explicit revalidation rules
 */

import {
    Product,
    ProductsResponse,
    ProductsData,
    CategoriesResponse,
} from "@/interface";

const BASE_URL = process.env.NEXT_PUBLIC_BE_BASE_URL || "http://localhost:3000";

/**
 * Normalize raw API response to typed ProductsData
 * Defensive parsing with error handling
 */
export function normalizeProductsResponse(raw: unknown): ProductsData {
    try {
        if (!raw || typeof raw !== "object") {
            console.error("[normalizeProductsResponse] Invalid response:", raw);
            return {
                products: [],
                meta: { totalPages: 0, currentPage: 1, totalProducts: 0 },
            };
        }

        const response = raw as ProductsResponse;

        // Validate response structure
        if (!response.success || !response.data) {
            console.error(
                "[normalizeProductsResponse] Response not successful or missing data:",
                response
            );
            return {
                products: [],
                meta: { totalPages: 0, currentPage: 1, totalProducts: 0 },
            };
        }

        return response.data;
    } catch (error) {
        console.error("[normalizeProductsResponse] Error normalizing:", error);
        return {
            products: [],
            meta: { totalPages: 0, currentPage: 1, totalProducts: 0 },
        };
    }
}

/**
 * Normalize single product from envelope response
 */
export function normalizeProductResponse(raw: unknown): Product | null {
    try {
        if (!raw || typeof raw !== "object") {
            return null;
        }

        const response = raw as { success: boolean; data: Product };
        if (!response.success || !response.data) {
            return null;
        }

        return response.data;
    } catch (error) {
        console.error("[normalizeProductResponse] Error normalizing:", error);
        return null;
    }
}

/**
 * Server-side fetch with default caching for product lists
 * TTL: 60 seconds for lists
 * Defaults to showing only ACTIVE products for customer-facing pages
 */
export async function fetchProductsFeed(params: {
    page?: number;
    limit?: number;
    categoryId?: string;
    status?: "ACTIVE" | "INACTIVE";
    search?: string;
    priceMin?: number;
    priceMax?: number;
}): Promise<ProductsData> {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.append("page", params.page.toString());
    if (params.limit) searchParams.append("limit", params.limit.toString());
    if (params.categoryId) searchParams.append("categoryId", params.categoryId);
    // Default to ACTIVE status if not explicitly provided
    searchParams.append("status", params.status || "ACTIVE");
    if (params.search) searchParams.append("name", params.search); // Backend expects 'name' not 'search'
    if (params.priceMin !== undefined)
        searchParams.append("priceMin", params.priceMin.toString());
    if (params.priceMax !== undefined)
        searchParams.append("priceMax", params.priceMax.toString());

    const url = `${BASE_URL}/api/products${
        searchParams.toString() ? `?${searchParams}` : ""
    }`;

    try {
        const res = await fetch(url, {
            next: { revalidate: 60, tags: ["products"] }, // Cache for 60s
        });

        if (!res.ok) {
            console.error(
                `[fetchProductsFeed] HTTP ${res.status}:`,
                await res.text()
            );
            return {
                products: [],
                meta: { totalPages: 0, currentPage: 1, totalProducts: 0 },
            };
        }

        const raw = await res.json();
        return normalizeProductsResponse(raw);
    } catch (error) {
        console.error("[fetchProductsFeed] Fetch error:", error);
        return {
            products: [],
            meta: { totalPages: 0, currentPage: 1, totalProducts: 0 },
        };
    }
}

/**
 * Server-side fetch for single product details
 * TTL: 300 seconds (5 minutes) for product pages
 */
export async function fetchProductDetails(
    idOrSlug: string
): Promise<Product | null> {
    const url = `${BASE_URL}/api/products/${idOrSlug}`;

    try {
        const res = await fetch(url, {
            next: {
                revalidate: 300,
                tags: ["products", `product:${idOrSlug}`],
            }, // Cache for 5 minutes
        });

        if (!res.ok) {
            console.error(`[fetchProductDetails] HTTP ${res.status}`);
            return null;
        }

        const raw = await res.json();
        return normalizeProductResponse(raw);
    } catch (error) {
        console.error("[fetchProductDetails] Fetch error:", error);
        return null;
    }
}

/**
 * Fetch categories for filter dropdown
 * TTL: 300 seconds (categories change less frequently)
 */
export async function fetchCategoriesForFilter(): Promise<
    Array<{ id: string; name: string }>
> {
    const url = `${BASE_URL}/api/categories`;

    try {
        const res = await fetch(url, {
            next: { revalidate: 300, tags: ["categories"] },
        });

        if (!res.ok) {
            console.error(`[fetchCategoriesForFilter] HTTP ${res.status}`);
            return [];
        }

        const raw: CategoriesResponse = await res.json();

        if (!raw.success || !raw.data?.categories) {
            return [];
        }

        return raw.data.categories.map((cat) => ({
            id: cat.id,
            name: cat.name,
        }));
    } catch (error) {
        console.error("[fetchCategoriesForFilter] Fetch error:", error);
        return [];
    }
}

/**
 * Get lowest price from product variants
 * Used for display in product cards
 */
export function getLowestPrice(
    product: Product
): { amount: string; currency: string; compareAt?: string } | null {
    if (!product.variants?.length) return null;

    let lowest: {
        amount: string;
        currency: string;
        compareAt?: string;
    } | null = null;
    let lowestValue = Infinity;

    for (const variant of product.variants) {
        if (!variant.prices?.length) continue;

        for (const price of variant.prices) {
            const value = parseFloat(price.amount);
            if (!isNaN(value) && value < lowestValue) {
                lowestValue = value;
                lowest = {
                    amount: price.amount,
                    currency: price.currency,
                    compareAt: price.compareAt || undefined,
                };
            }
        }
    }

    return lowest;
}

/**
 * Get total stock across all variants
 */
export function getTotalStock(product: Product): number {
    if (!product.variants?.length) return 0;

    return product.variants.reduce((total, variant) => {
        return total + (variant.inventory?.stockOnHand || 0);
    }, 0);
}

/**
 * Format price for display
 */
export function formatPrice(amount: string, currency: string): string {
    const value = parseFloat(amount);
    if (isNaN(value)) return amount;

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(value);
}
