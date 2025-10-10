import { UserResponse } from "@/interface/login";
import NextAuth, { User } from "next-auth";
import { JWT } from "next-auth/jwt";
declare module "next-auth" {
    interface Session {
        user: UserResponse;
    }
    interface User {
        user: UserResponse;
        token: string;
    }
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
declare module "next-auth/jwt" {
    interface JWT extends User {
        id?: string;
    }
}
