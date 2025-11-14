/**
 * Centralized fetch helper for API calls
 * Uses Next.js fetch with caching and revalidation
 * Attaches Authorization header from localStorage
 */

import { getBackendAccessToken } from "@/lib/auth";
const BASE_URL = process.env.NEXT_PUBLIC_BE_BASE_URL || "http://localhost:3000";

interface FetchOptions extends RequestInit {
    revalidate?: number;
    tags?: string[];
}

// Removed getAuthToken and localStorage usage. Use getBackendAccessToken for server-side token retrieval.

/**
 * Centralized fetcher with auth, caching, and error handling
 */
export async function fetcher<T>(
    endpoint: string,
    options: FetchOptions = {}
): Promise<T> {
    const { revalidate, tags, ...fetchOptions } = options;

    let token: string | null = null;
    if (typeof window === "undefined") {
        // Server-side: use getBackendAccessToken
        token = await getBackendAccessToken();
    }
    // Client-side: do not use localStorage for access_token anymore

    const headers: HeadersInit = {
        ...fetchOptions.headers,
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    if (!(fetchOptions.body instanceof FormData) && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }

    const url = `${BASE_URL}${endpoint}`;

    const nextConfig: { revalidate?: number; tags?: string[] } = {};
    if (revalidate !== undefined) {
        nextConfig.revalidate = revalidate;
    }
    if (tags) {
        nextConfig.tags = tags;
    }

    try {
        const response = await fetch(url, {
            ...fetchOptions,
            headers,
            next: Object.keys(nextConfig).length > 0 ? nextConfig : undefined,
        });

        // Handle non-OK responses
        if (!response.ok) {
            if (response.status === 401) {
                // Unauthorized - clear token and redirect
                if (typeof window !== "undefined") {
                    localStorage.removeItem("access_token");
                    window.location.href = "/login";
                }
                throw new Error("Unauthorized");
            }

            if (response.status === 429) {
                throw new Error("Rate limit exceeded. Please try again later.");
            }

            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.message ||
                    `HTTP ${response.status}: ${response.statusText}`
            );
        }

        return await response.json();
    } catch (error) {
        console.error("Fetch error:", error);
        throw error;
    }
}

/**
 * Normalize product response from backend envelope
 * Adapts backend shape to frontend model
 */
export function normalizeProductResponse(raw: any): any {
    // Assumption: Backend returns { success, data, error, message, statusCode, timestamp }
    if (raw.data) {
        return raw.data;
    }
    return raw;
}

/**
 * GET request with default caching (60s)
 */
export async function get<T>(endpoint: string, revalidate = 60): Promise<T> {
    return fetcher<T>(endpoint, {
        method: "GET",
        revalidate,
    });
}

/**
 * POST request with no caching
 */
export async function post<T>(endpoint: string, body: any): Promise<T> {
    return fetcher<T>(endpoint, {
        method: "POST",
        body: body instanceof FormData ? body : JSON.stringify(body),
        cache: "no-store",
    });
}

/**
 * PATCH request with no caching
 */
export async function patch<T>(endpoint: string, body: any): Promise<T> {
    return fetcher<T>(endpoint, {
        method: "PATCH",
        body: JSON.stringify(body),
        cache: "no-store",
    });
}

/**
 * DELETE request with no caching
 */
export async function del<T>(endpoint: string): Promise<T> {
    return fetcher<T>(endpoint, {
        method: "DELETE",
        cache: "no-store",
    });
}

/**
 * PUT request with no caching
 */
export async function put<T>(endpoint: string, body: any): Promise<T> {
    return fetcher<T>(endpoint, {
        method: "PUT",
        body: body instanceof FormData ? body : JSON.stringify(body),
        cache: "no-store",
    });
}
