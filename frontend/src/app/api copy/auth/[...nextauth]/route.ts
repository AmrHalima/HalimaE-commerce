import {
    FailedLoginResponse,
    SuccessfulLoginResponse,
} from "@/interface/login";
import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
const authOptions: AuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Halima Account",
            credentials: {
                email: {},
                password: {},
            },
            authorize: async (credentials) => {
                const res = await fetch(
                    "https://ecommerce.routemisr.com/api/v1/auth/signin",
                    {
                        method: "POST",
                        body: JSON.stringify({
                            email: credentials?.email,
                            password: credentials?.password,
                        }),
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                );
                const payload: SuccessfulLoginResponse | FailedLoginResponse =
                    await res.json();
                if ("token" in payload) {
                    return {
                        id: payload.user.email,
                        user: payload.user,
                        token: payload.token,
                    };
                } else {
                    throw new Error(payload.message);
                }
            },
        }),
    ],
    callbacks: {
        jwt: ({ token, user }) => {
            if (user) {
                token.user = user.user;
                token.token = user.token;
            }
            return token;
        },
        session: ({ token, session }) => {
            session.user = token.user;
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

export { handler as GET, handler as POST, authOptions };
