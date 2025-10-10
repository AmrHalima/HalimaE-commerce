"use server";

import { Cart } from "@/interface/cart";
import { decode } from "next-auth/jwt";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

async function getAuthToken() {
    const encToken = (await cookies()).get(`${process.env.TOKEN_NAME}`)?.value;
    if (!encToken) return null;
    return await decode({
        token: encToken,
        secret: process.env.NEXTAUTH_SECRET!,
    });
}

// This is our source of truth for a fully populated cart.
export async function getCart(): Promise<Cart | null> {
    const token = await getAuthToken();
    if (!token) return null;

    try {
        const res = await fetch(`${process.env.API_URL}/cart`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                token: token.token as string,
            },
            next: { tags: ["cart"] }, // Add tag for revalidation
        });

        if (!res.ok) {
            // The API might return 404 if the cart is empty, handle this gracefully
            if (res.status === 404) {
                return null;
            }
            throw new Error(`Failed to fetch cart: ${res.statusText}`);
        }

        const cart: Cart = await res.json();
        return cart;
    } catch (err) {
        console.error("getCart error:", err);
        return null;
    }
}

// All mutation functions will now call getCart() to return consistent data.
export async function addToCart(productId?: string): Promise<Cart | null> {
    const token = await getAuthToken();
    if (!token) throw new Error("Authentication required");

    try {
        const res = await fetch(`${process.env.API_URL}/cart`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                token: token.token as string,
            },
            body: JSON.stringify({ productId }),
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || "Failed to add to cart");
        }
        revalidatePath("/cart"); // Revalidate cart page
        return await getCart(); // Return the populated cart
    } catch (err) {
        console.error("addToCart error:", err);
        throw err;
    }
}

export async function removeCartItem(cartItemId: string): Promise<Cart | null> {
    const token = await getAuthToken();
    if (!token) throw new Error("Authentication required");

    try {
        const res = await fetch(`${process.env.API_URL}/cart/${cartItemId}`, {
            method: "DELETE",
            headers: {
                token: token.token as string,
            },
        });

        if (!res.ok) throw new Error("Failed to remove item from cart");
        revalidatePath("/cart");
        return await getCart(); // Return the populated cart
    } catch (err) {
        console.error("removeCartItem error:", err);
        throw err;
    }
}

export async function updateCartItem(
    cartItemId: string,
    count: number
): Promise<Cart | null> {
    const token = await getAuthToken();
    if (!token) throw new Error("Authentication required");

    try {
        const res = await fetch(`${process.env.API_URL}/cart/${cartItemId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                token: token.token as string,
            },
            body: JSON.stringify({ count }),
        });

        if (!res.ok) throw new Error("Failed to update item");
        revalidatePath("/cart");
        return await getCart(); // Return the populated cart
    } catch (err) {
        console.error("updateCartItem error:", err);
        throw err;
    }
}

export async function clearCart(): Promise<Cart | null> {
    const token = await getAuthToken();
    if (!token) throw new Error("Authentication required");

    try {
        const res = await fetch(`${process.env.API_URL}/cart`, {
            method: "DELETE",
            headers: {
                token: token.token as string,
            },
        });

        // The clear cart API returns a different, simpler response.
        // We just need to know it succeeded, then we can fetch the (now empty) cart.
        if (!res.ok) throw new Error("Failed to clear cart");
        revalidatePath("/cart");
        return await getCart(); // Should return null or an empty cart
    } catch (err) {
        console.error("clearCart error:", err);
        throw err;
    }
}

// ... checkOutSession remains the same as it doesn't return a cart object
export async function checkOutSession(cartId: string) {
    const token = await getAuthToken();
    if (!token) throw new Error("Authentication required");

    const shippingAddress = {
        details: "details",
        phone: "01010700999",
        city: "Cairo",
    };

    try {
        const res = await fetch(
            `${process.env.API_URL}/orders/checkout-session/${cartId}?url=${process.env.NEXTAUTH_URL}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    token: token.token as string,
                },
                body: JSON.stringify({ shippingAddress }),
            }
        );

        if (!res.ok) {
            throw new Error("Failed to start checkout session");
        }

        const data = await res.json();
        return data; // Return the session data for redirection on the client
    } catch (err) {
        console.error("checkOutSession error:", err);
        throw err;
    }
}
