"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import * as jose from "jose";
import { hkdf } from "@panva/hkdf";

const SESSION_COOKIE_NAME = "next-auth.session-token";
const SECURE_SESSION_COOKIE_NAME = "__Secure-next-auth.session-token";

/**
 * Server utility to retrieve the backend access token from the NextAuth JWT cookie.
 * Reads the session token cookie and decodes it using NEXTAUTH_SECRET.
 */
export async function getBackendAccessToken(): Promise<string | null> {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
        throw new Error("Missing NEXTAUTH_SECRET environment variable");
    }

    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const sessionCookie =
        allCookies.find((c) => c.name === SESSION_COOKIE_NAME) ??
        allCookies.find((c) => c.name === SECURE_SESSION_COOKIE_NAME);

    if (!sessionCookie) {
        return null;
    }

    try {
        // Use NextAuth's key derivation method (HKDF) to derive the encryption key
        const encryptionSecret = await hkdf(
            "sha256",
            secret,
            "",
            "NextAuth.js Generated Encryption Key",
            32 // 256 bits
        );

        // Decrypt the JWT token
        const { payload } = await jose.jwtDecrypt(
            sessionCookie.value,
            encryptionSecret,
            {
                clockTolerance: 15,
            }
        );

        // Extract the backend access token
        const tokenValue = payload.token;
        if (typeof tokenValue !== "string") {
            return null;
        }

        return tokenValue;
    } catch (err) {
        console.error("Failed to decode session token:", err);
        return null;
    }
}

/**
 * Get current session on the server
 */
export async function getSession() {
    return await getServerSession(authOptions);
}

/**
 * Require authentication - redirects to login if not authenticated
 * @param requireStaff - If true, requires admin or employee role
 * @param requireAdmin - If true, requires admin role only
 */
export async function requireAuth(
    requireStaff: boolean = false,
    requireAdmin: boolean = false
) {
    const session = await getSession();

    if (!session) {
        redirect("/management/login");
    }

    const role = (session.user as any)?.role;

    if (requireAdmin && role !== "admin") {
        redirect("/management/login?error=admin-required");
    }

    if (requireStaff && role !== "admin" && role !== "employee") {
        redirect("/management/login?error=unauthorized");
    }

    return session;
}

/**
 * Check if user is staff (admin or employee)
 */
export async function isStaff(): Promise<boolean> {
    const session = await getSession();
    const role = (session?.user as any)?.role;
    return role === "admin" || role === "employee";
}

/**
 * Check if user is admin
 */
export async function isAdmin(): Promise<boolean> {
    const session = await getSession();
    const role = (session?.user as any)?.role;
    return role === "admin";
}

/**
 * Get authorization header for API calls
 */
export async function getAuthHeader(): Promise<Record<string, string>> {
    const token = await getBackendAccessToken();

    if (!token) {
        throw new Error("Not authenticated");
    }

    return {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    };
}

/**
 * Get authorization header for FormData API calls
 */
export async function getAuthHeaderForFormData(): Promise<
    Record<string, string>
> {
    const token = await getBackendAccessToken();

    if (!token) {
        throw new Error("Not authenticated");
    }

    return {
        Authorization: `Bearer ${token}`,
    };
}
