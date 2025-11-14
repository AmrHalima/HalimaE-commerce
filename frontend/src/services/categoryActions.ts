/**
 * Category Actions - Server-side data fetching for categories
 */

import { Category, CategoriesResponse } from "@/interface/category";

const BASE_URL = process.env.NEXT_PUBLIC_BE_BASE_URL || "http://localhost:3000";

/**
 * Create a new category (client-side action)
 */
export async function createCategory(data: {
    name: string;
    slug: string;
}): Promise<Category> {
    const url = `${BASE_URL}/api/categories`;

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        cache: "no-store",
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to create category");
    }

    const response: { success: boolean; data: Category } = await res.json();

    if (!response.success || !response.data) {
        throw new Error("Failed to create category");
    }

    return response.data;
}

/**
 * Update an existing category
 */
export async function updateCategory(
    id: string,
    data: { name: string; slug: string }
): Promise<Category> {
    const url = `${BASE_URL}/api/categories/${id}`;

    const res = await fetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        cache: "no-store",
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to update category");
    }

    const response: { success: boolean; data: Category } = await res.json();

    if (!response.success || !response.data) {
        throw new Error("Failed to update category");
    }

    return response.data;
}

/**
 * Delete a category
 */
export async function deleteCategory(id: string): Promise<void> {
    const url = `${BASE_URL}/api/categories/${id}`;

    const res = await fetch(url, {
        method: "DELETE",
        cache: "no-store",
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to delete category");
    }
}

/**
 * Get categories (alias for fetchCategories for backward compatibility)
 */
export async function getCategories(params?: {
    page?: number;
    limit?: number;
    search?: string;
}): Promise<{
    categories: Category[];
    meta: { totalCategories: number; totalPages: number; currentPage: number };
}> {
    return fetchCategories(params);
}

/**
 * Fetch all categories with product counts
 * TTL: 300 seconds (categories change less frequently)
 */
export async function fetchCategories(params?: {
    page?: number;
    limit?: number;
    search?: string;
}): Promise<{
    categories: Category[];
    meta: { totalCategories: number; totalPages: number; currentPage: number };
}> {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.search) searchParams.append("name", params.search);

    const url = `${BASE_URL}/api/categories${
        searchParams.toString() ? `?${searchParams}` : ""
    }`;

    try {
        const res = await fetch(url, {
            next: { revalidate: 300, tags: ["categories"] },
        });

        if (!res.ok) {
            console.error(`[fetchCategories] HTTP ${res.status}`);
            return {
                categories: [],
                meta: { totalCategories: 0, totalPages: 0, currentPage: 1 },
            };
        }

        const raw: CategoriesResponse = await res.json();

        if (!raw.success || !raw.data?.categories) {
            return {
                categories: [],
                meta: { totalCategories: 0, totalPages: 0, currentPage: 1 },
            };
        }

        return {
            categories: raw.data.categories,
            meta: raw.data.meta,
        };
    } catch (error) {
        console.error("[fetchCategories] Fetch error:", error);
        return {
            categories: [],
            meta: { totalCategories: 0, totalPages: 0, currentPage: 1 },
        };
    }
}

/**
 * Fetch single category by ID or slug
 */
export async function fetchCategoryDetails(
    idOrSlug: string
): Promise<Category | null> {
    const url = `${BASE_URL}/api/categories/${idOrSlug}`;

    try {
        const res = await fetch(url, {
            next: {
                revalidate: 300,
                tags: ["categories", `category:${idOrSlug}`],
            },
        });

        if (!res.ok) {
            console.error(`[fetchCategoryDetails] HTTP ${res.status}`);
            return null;
        }

        const raw: { success: boolean; data: Category } = await res.json();

        if (!raw.success || !raw.data) {
            return null;
        }

        return raw.data;
    } catch (error) {
        console.error("[fetchCategoryDetails] Fetch error:", error);
        return null;
    }
}
