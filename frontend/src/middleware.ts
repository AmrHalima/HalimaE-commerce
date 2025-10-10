// middleware.ts
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPages = [
    "/cart",
    "/profile",
    "/checkout",
    "/wishlist",
    "/allorders",
];
const authPages = ["/login", "/register"];

/**
 * Decide if the pathname should be treated as a protected/auth route.
 * We use startsWith so nested routes (e.g. /profile/settings) are covered.
 */
const matches = (pathname: string, list: string[]) =>
    list.some(
        (p) =>
            pathname === p ||
            pathname.startsWith(`${p}/`) ||
            pathname.startsWith(p)
    );

export default async function middleware(req: NextRequest) {
    try {
        // Don't run middleware on static files, public files or API routes
        const { pathname } = req.nextUrl;
        if (
            pathname.startsWith("/_next") ||
            pathname.startsWith("/static") ||
            pathname.startsWith("/api") ||
            pathname.includes(".") // skip requests for files like .png .svg .ico etc.
        ) {
            return NextResponse.next();
        }

        // Attempt to get token. Use NEXTAUTH_SECRET if provided, otherwise let getToken infer.
        const token = await getToken({
            req,
            // secret: process.env.NEXTAUTH_SECRET, // optional: uncomment if you set NEXTAUTH_SECRET
        });

        const origin = process.env.NEXTAUTH_URL ?? req.nextUrl.origin;

        // If user is trying to access a protected page but has no token => redirect to login
        if (matches(pathname, protectedPages)) {
            if (!token) {
                const redirectUrl = new URL("/login", origin);
                // preserve the original url so we can redirect back after login
                redirectUrl.searchParams.set(
                    "from",
                    `${req.nextUrl.pathname}${req.nextUrl.search}`
                );
                return NextResponse.redirect(redirectUrl);
            }
            // token exists -> allow
            return NextResponse.next();
        }

        // If user is on an auth-only page (login/register) but already authenticated -> forward to home
        if (matches(pathname, authPages)) {
            if (token) {
                const redirectUrl = new URL("/", origin);
                return NextResponse.redirect(redirectUrl);
            }
            return NextResponse.next();
        }

        // Default: let it pass
        return NextResponse.next();
    } catch (err) {
        // In case of error, allow navigation but optionally log
        // (don't block traffic because of middleware crash)
        // eslint-disable-next-line no-console
        console.error("Middleware error:", err);
        return NextResponse.next();
    }
}

/**
 * Configure the matcher (which paths this middleware should run for).
 * You can customize this list — currently we run for:
 * - /cart, /profile, /checkout, /wishlist, /allorders, /login, /register
 *
 * If you prefer the middleware to run for all pages, remove `matcher`.
 */
export const config = {
    matcher: [
        /*
      Match exact pages and any subpaths. Using these patterns
      keeps middleware from running on every request (assets, api, etc).
    */
        "/cart/:path*",
        "/profile/:path*",
        "/checkout/:path*",
        "/wishlist/:path*",
        "/allorders/:path*",
        "/login",
        "/register",
    ],
};
