"use client";
import { Cart } from "@/interface/cart";
import { getCart } from "@/services/cartActions";
import { useSession } from "next-auth/react";
import React, { createContext, useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

// Define the context shape
export const CartContext = createContext<{
    cart: Cart | null;
    loading: boolean;
    fetchCart: () => Promise<void>;
    setCart: React.Dispatch<React.SetStateAction<Cart | null>>;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}>({
    cart: null,
    loading: true,
    fetchCart: async () => {},
    setCart: () => {},
    setLoading: () => {},
});

export default function CartContextProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [cart, setCart] = useState<Cart | null>(null);
    const [loading, setLoading] = useState(true);
    const { status } = useSession();

    const fetchCart = useCallback(async () => {
        if (status === "unauthenticated") {
            setCart(null);
            setLoading(false);
            return;
        }
        if (status === "authenticated") {
            setLoading(true);
            try {
                const newCart = await getCart();
                setCart(newCart);
            } catch (error) {
                if (error instanceof Error)
                    toast.error("Failed to load cart: " + error.message);
                setCart(null); // Clear cart on error
            } finally {
                setLoading(false);
            }
        }
    }, [status]);

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    return (
        <CartContext.Provider
            value={{ cart, loading, fetchCart, setCart, setLoading }}
        >
            {children}
        </CartContext.Provider>
    );
}
