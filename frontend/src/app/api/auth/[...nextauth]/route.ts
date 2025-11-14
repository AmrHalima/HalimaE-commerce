import NextAuth, { AuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

const BASE_URL = process.env.NEXT_PUBLIC_BE_BASE_URL!;
if (!BASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_BE_BASE_URL");
}

interface LoginResponse {
    success: boolean;
    data: {
        email: string;
        name?: string;
        role: {
            name: "admin" | "employee" | "customer";
        };
        access_token: string;
    };
    message?: string;
    statusCode?: number;
}

async function postJSON<T>(url: string, body: unknown): Promise<T> {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
        const msg =
            (data && (data.message || data.statusMsg)) ||
            "Authentication failed";
        throw new Error(msg);
    }
    return data;
}

export const authOptions: AuthOptions = {
    session: { strategy: "jwt" },
    providers: [
        Credentials({
            id: "customer-credentials",
            name: "Customer",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                if (!credentials?.email || !credentials?.password)
                    throw new Error("Missing credentials");
                const payload = await postJSON<LoginResponse>(
                    `${BASE_URL}/api/customers/auth/login`,
                    {
                        email: credentials.email,
                        password: credentials.password,
                    }
                );
                const backendToken = payload?.data?.access_token;
                const user = payload?.data ?? {
                    email: credentials.email,
                    role: { name: "customer" as const },
                };
                return {
                    id: user.email,
                    user: {
                        email: user.email,
                        role: "customer",
                        name: user.name,
                    },
                    token: backendToken,
                    role: "customer",
                } as any;
            },
        }),
        Credentials({
            id: "staff-credentials",
            name: "Staff",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                if (!credentials?.email || !credentials?.password)
                    throw new Error("Missing credentials");
                const payload = await postJSON<LoginResponse>(
                    `${BASE_URL}/api/admin/auth/login`,
                    {
                        email: credentials.email,
                        password: credentials.password,
                    }
                );

                const backendToken = payload?.data?.access_token;
                const role = (
                    payload?.data?.role?.name || "employee"
                ).toLowerCase() as "admin" | "employee";
                const user = payload?.data ?? {
                    email: credentials.email,
                    role: { name: role },
                };

                return {
                    id: user.email,
                    user: {
                        email: user.email,
                        role,
                        name: user.name,
                    },
                    token: backendToken,
                    role,
                } as any;
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                const u = user as any;
                token.user = u.user ?? u;

                // Store role in token
                if (u.role) {
                    const roleValue = String(u.role).toLowerCase();
                    if (
                        roleValue === "admin" ||
                        roleValue === "employee" ||
                        roleValue === "customer"
                    ) {
                        token.role = roleValue;
                    }
                }

                // Store backend access token in JWT (not exposed in session for security)
                if (u.token) {
                    token.token = u.token;
                }
            }

            // Ensure role fallback for existing sessions
            if (!(token as any).role) {
                (token as any).role = "customer";
            }

            return token;
        },
        async session({ session, token }) {
            (session as any).user = (token as any).user ?? session.user;
            const role = (token as any).role;

            // Don't expose backend token in session for security
            // Token is only accessible server-side via getBackendAccessToken()
            if (role) {
                (session as any).user.role = role;
            }

            return session;
        },
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
