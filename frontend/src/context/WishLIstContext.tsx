"use client";
import Wishlist from "@/interface/wishlist";
import {
    addToWishlist,
    getWishList,
    removeFromWishlist,
} from "@/services/wishlistActions";
import { useSession } from "next-auth/react";
import React, {
    createContext,
    ReactNode,
    useEffect,
    useState,
    useCallback,
} from "react";
import { toast } from "sonner";

// Define a more robust context shape
export const WishListContext = createContext<{
    wishList: Wishlist | null;
    loading: boolean;
    itemCount: number;
    isItemInWishlist: (productId: string) => boolean;
    addItem: (productId: string) => Promise<void>;
    removeItem: (productId: string) => Promise<void>;
}>({
    wishList: null,
    loading: true,
    itemCount: 0,
    isItemInWishlist: () => false,
    addItem: async () => {},
    removeItem: async () => {},
});

export default function WishLIstContextProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [wishList, setWishList] = useState<Wishlist | null>(null);
    const [loading, setLoading] = useState(true);
    const { status } = useSession();

    // Fetch initial wishlist data
    const fetchWishList = useCallback(async () => {
        if (status === "authenticated") {
            setLoading(true);
            try {
                const list = await getWishList();
                setWishList(list);
            } catch (error) {
                if (error instanceof Error)
                    toast.error("Failed to load wishlist: " + error.message);
            } finally {
                setLoading(false);
            }
        } else {
            // If not authenticated, clear the list
            setWishList(null);
            setLoading(false);
        }
    }, [status]);

    useEffect(() => {
        fetchWishList();
    }, [fetchWishList]);

    // Function to add an item
    const addItem = async (productId: string) => {
        try {
            const updatedWishlist = await addToWishlist(productId);
            setWishList(updatedWishlist);
            toast.success("Item added to wishlist!");
        } catch (error) {
            if (error instanceof Error) toast.error(error.message);
        }
    };

    // Function to remove an item
    const removeItem = async (productId: string) => {
        try {
            const updatedWishlist = await removeFromWishlist(productId);
            setWishList(updatedWishlist);
            toast.success("Item removed from wishlist.");
        } catch (error) {
            if (error instanceof Error) toast.error(error.message);
        }
    };

    // Helper to check if an item exists
    const isItemInWishlist = (productId: string) => {
        return !!wishList?.data?.some((item) => item.id === productId);
    };

    const itemCount = wishList?.count ?? 0;

    return (
        <WishListContext.Provider
            value={{
                wishList,
                loading,
                itemCount,
                isItemInWishlist,
                addItem,
                removeItem,
            }}
        >
            {children}
        </WishListContext.Provider>
    );
}
