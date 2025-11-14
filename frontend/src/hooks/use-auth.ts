"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Hook to protect client components and ensure user is authenticated staff
 * @param requireAdmin - If true, only allows admin role (not employee)
 */
export function useRequireAuth(requireAdmin: boolean = false) {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "loading") return;

        if (!session) {
            router.push("/management/login");
            return;
        }

        const role = (session.user as any)?.role;

        if (requireAdmin && role !== "admin") {
            router.push("/management/dashboard?error=admin-required");
            return;
        }

        if (role !== "admin" && role !== "employee") {
            router.push("/management/login?error=unauthorized");
        }
    }, [session, status, router, requireAdmin]);

    return {
        session,
        status,
        isLoading: status === "loading",
        isAuthenticated: !!session,
        isAdmin: (session?.user as any)?.role === "admin",
        isEmployee: (session?.user as any)?.role === "employee",
        isStaff: ["admin", "employee"].includes((session?.user as any)?.role),
    };
}

/**
 * Hook to get current user role and permissions
 */
export function useAuth() {
    const { data: session, status } = useSession();

    const role = (session?.user as any)?.role;

    return {
        session,
        status,
        isLoading: status === "loading",
        isAuthenticated: !!session,
        role,
        isAdmin: role === "admin",
        isEmployee: role === "employee",
        isStaff: ["admin", "employee"].includes(role),
        isCustomer: role === "customer",
        user: session?.user,
    };
}
