"use server";

import Wishlist from "@/interface/wishlist";
import { decode } from "next-auth/jwt";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

// Helper to reduce token repetition
async function getAuthToken() {
    const encToken = (await cookies()).get(`${process.env.TOKEN_NAME}`)?.value;
    if (!encToken) return null;
    return await decode({
        token: encToken,
        secret: process.env.NEXTAUTH_SECRET!,
    });
}

export async function getWishList(): Promise<Wishlist | null> {
    const token = await getAuthToken();
    if (!token?.token) return null;

    try {
        const res = await fetch(`${process.env.API_URL}/wishlist`, {
            method: "GET",
            headers: {
                token: token.token as string,
            },
            cache: "no-store", // Ensure fresh data is always fetched
        });

        if (!res.ok) {
            // API returns 404 for empty wishlist, which is valid
            if (res.status === 404) return null;
            throw new Error(`API Error: ${res.statusText}`);
        }

        const wishList: Wishlist = await res.json();
        return wishList;
    } catch (err) {
        console.error("getWishList error:", err);
        // Return null to indicate an issue or empty list
        return null;
    }
}

export async function removeFromWishlist(
    productId: string
): Promise<Wishlist | null> {
    const token = await getAuthToken();
    if (!token?.token) throw new Error("Authentication required.");

    const res = await fetch(
        `${process.env.API_URL}/wishlist/${productId}`, // Corrected URL
        {
            method: "DELETE",
            headers: {
                token: token.token as string,
            },
        }
    );

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to remove from wishlist.");
    }

    revalidatePath("/wishlist"); // Invalidate cache for the wishlist page
    return await getWishList(); // Return the updated wishlist
}

export async function addToWishlist(
    productId: string
): Promise<Wishlist | null> {
    const token = await getAuthToken();
    if (!token?.token) throw new Error("Authentication required.");

    const res = await fetch(`${process.env.API_URL}/wishlist`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            token: token.token as string,
        },
        body: JSON.stringify({ productId }),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to add to wishlist.");
    }

    revalidatePath("/wishlist");
    return await getWishList(); // Return the updated wishlist
}
