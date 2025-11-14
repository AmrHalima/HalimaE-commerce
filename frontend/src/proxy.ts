// middleware.ts
import { getToken } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPages = ["/cart", "/profile", "/checkout", "/allorders"];
const authPages = ["/login", "/register"];
const managementPages = ["/management"];
const managementLoginPage = "/management/login";

const matches = (pathname: string, list: string[]) =>
    list.some(
        (p) =>
            pathname === p ||
            pathname.startsWith(`${p}/`) ||
            pathname.startsWith(p)
    );

interface ExtendedJWT extends JWT {
    role?: "admin" | "employee" | "customer";
    token?: string;
    user?: {
        name?: string | null;
        email?: string | null;
        role?: "admin" | "employee" | "customer";
    };
}

export default async function proxy(req: NextRequest) {
    try {
        const { pathname } = req.nextUrl;

        // Skip static & API routes
        if (
            pathname.startsWith("/_next") ||
            pathname.startsWith("/static") ||
            pathname.startsWith("/api") ||
            pathname.includes(".")
        ) {
            return NextResponse.next();
        }

        const token = (await getToken({
            req,
            secret: process.env.NEXTAUTH_SECRET,
        })) as ExtendedJWT | null;
        const origin = process.env.NEXTAUTH_URL ?? req.nextUrl.origin;

        // 🛡️ 1. Protect general user pages
        if (matches(pathname, protectedPages)) {
            if (!token) {
                const redirectUrl = new URL("/login", origin);
                redirectUrl.searchParams.set(
                    "from",
                    req.nextUrl.pathname + req.nextUrl.search
                );
                return NextResponse.redirect(redirectUrl);
            }
            return NextResponse.next();
        }

        // 🧩 2. Protect management/admin pages
        if (matches(pathname, managementPages)) {
            // Allow access to management login page without authentication
            if (
                pathname === managementLoginPage ||
                pathname.startsWith("/management/login")
            ) {
                return NextResponse.next();
            }

            // Check if user is authenticated
            if (!token) {
                const redirectUrl = new URL(managementLoginPage, origin);
                redirectUrl.searchParams.set("callbackUrl", pathname);
                return NextResponse.redirect(redirectUrl);
            }

            // Check if user has admin or employee role
            const role = token.role?.toLowerCase() as string | undefined;
            if (!role || !["admin", "employee"].includes(role)) {
                const redirectUrl = new URL(managementLoginPage, origin);
                redirectUrl.searchParams.set("error", "unauthorized");
                return NextResponse.redirect(redirectUrl);
            }

            return NextResponse.next();
        }

        // 🔐 3. Prevent logged-in users from visiting login/register
        if (matches(pathname, authPages)) {
            if (token) {
                const redirectUrl = new URL("/", origin);
                return NextResponse.redirect(redirectUrl);
            }
            return NextResponse.next();
        }

        return NextResponse.next();
    } catch (err) {
        console.error("Middleware error:", err);
        return NextResponse.next();
    }
}

// Configure where middleware runs
export const config = {
    matcher: [
        "/cart/:path*",
        "/profile/:path*",
        "/checkout/:path*",
        "/wishlist/:path*",
        "/allorders/:path*",
        "/login",
        "/register",
        "/management/:path*", // ✅ protect admin/employee routes
    ],
};
