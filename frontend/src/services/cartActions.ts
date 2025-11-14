"use server";

import { Cart, CartResponse } from "@/interface/cart";
import { getBackendAccessToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL || "http://localhost:3000";

/**
 * Get the current user's cart
 * GET /api/cart
 */
export async function getCart(): Promise<Cart | null> {
    const token = await getBackendAccessToken();
    if (!token) return null;

    try {
        const res = await fetch(`${API_URL}/api/cart`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!res.ok) {
            // 404 means no cart exists yet
            if (res.status === 404) return null;
            throw new Error(`Failed to fetch cart: ${res.statusText}`);
        }

        const response: CartResponse = await res.json();
        return response.data;
    } catch (err) {
        console.error("getCart error:", err);
        return null;
    }
}

/**
 * Add item to cart
 * POST /api/cart/items
 * Body: { variantId: string, qty: number }
 */
export async function addToCart(
    variantId: string,
    qty: number = 1
): Promise<Cart | null> {
    const token = await getBackendAccessToken();
    if (!token) throw new Error("Authentication required");

    try {
        const res = await fetch(`${API_URL}/api/cart/items`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ variantId, qty }),
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(
                errorData.message || `Failed to add to cart: ${res.statusText}`
            );
        }

        // Fetch the updated cart after adding
        revalidatePath("/cart");
        return await getCart();
    } catch (err) {
        console.error("addToCart error:", err);
        throw err;
    }
}

/**
 * Update cart item quantity
 * PATCH /api/cart/items/:itemId
 * Body: { qty: number }
 */
export async function updateCartItemQty(
    itemId: string,
    qty: number
): Promise<Cart | null> {
    const token = await getBackendAccessToken();
    if (!token) throw new Error("Authentication required");

    console.log("updateCartItemQty called with:", { itemId, qty });

    try {
        const url = `${API_URL}/api/cart/items/${itemId}`;
        console.log("Making PATCH request to:", url);

        const res = await fetch(url, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ qty }),
        });

        console.log("Response status:", res.status);

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            console.error("API Error:", errorData);
            throw new Error(
                errorData.message || `Failed to update item: ${res.statusText}`
            );
        }

        const response = await res.json();
        console.log("API Response:", response);

        // The API returns just the updated item, not the full cart
        // We need to fetch the full cart to get the updated state
        revalidatePath("/cart");
        return await getCart();
    } catch (err) {
        console.error("updateCartItemQty error:", err);
        throw err;
    }
}

/**
 * Remove item from cart
 * DELETE /api/cart/items/:itemId
 */
export async function removeCartItem(itemId: string): Promise<Cart | null> {
    const token = await getBackendAccessToken();
    if (!token) throw new Error("Authentication required");

    try {
        const res = await fetch(`${API_URL}/api/cart/items/${itemId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(
                errorData.message || `Failed to remove item: ${res.statusText}`
            );
        }

        // Fetch the updated cart after removal
        revalidatePath("/cart");
        return await getCart();
    } catch (err) {
        console.error("removeCartItem error:", err);
        throw err;
    }
}

/**
 * Clear entire cart
 * DELETE /api/cart
 */
export async function clearCart(): Promise<boolean> {
    const token = await getBackendAccessToken();
    if (!token) throw new Error("Authentication required");

    try {
        const res = await fetch(`${API_URL}/api/cart`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(
                errorData.message || `Failed to clear cart: ${res.statusText}`
            );
        }

        revalidatePath("/cart");
        return true;
    } catch (err) {
        console.error("clearCart error:", err);
        throw err;
    }
}

/**
 * Create checkout session
 * POST /api/orders/checkout-session/:cartId
 */
export async function createCheckoutSession(cartId: string) {
    const token = await getBackendAccessToken();
    if (!token) throw new Error("Authentication required");

    const shippingAddress = {
        details: "details",
        phone: "01010700999",
        city: "Cairo",
    };

    try {
        const res = await fetch(
            `${API_URL}/api/orders/checkout-session/${cartId}?url=${process.env.NEXTAUTH_URL}`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ shippingAddress }),
            }
        );

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(
                errorData.message ||
                    `Failed to create checkout: ${res.statusText}`
            );
        }

        return await res.json();
    } catch (err) {
        console.error("createCheckoutSession error:", err);
        throw err;
    }
}
