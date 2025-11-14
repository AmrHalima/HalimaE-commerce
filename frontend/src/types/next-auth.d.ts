import { JWT } from "next-auth/jwt";
import NextAuth from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            name?: string | null;
            email?: string | null;
            role?: "admin" | "employee" | "customer";
            // Note: Backend access token is NOT exposed in session for security
            // Use getBackendAccessToken() server-side function to retrieve it
        };
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role?: "admin" | "employee" | "customer";
        token?: string; // backend access token
        user?: {
            name?: string | null;
            email?: string | null;
            role?: "admin" | "employee" | "customer";
        };
    }
}
