"use client";
import Wishlist, { WishlistItem } from "@/interface/wishlist";
import { getLowestPrice } from "@/lib/api";
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
    addItem: (productId: string, productData?: any) => Promise<void>;
    removeItem: (productId: string) => Promise<void>;
}>({
    wishList: null,
    loading: true,
    itemCount: 0,
    isItemInWishlist: () => false,
    addItem: async () => {},
    removeItem: async () => {},
});

const WISHLIST_STORAGE_KEY = "wishlist";

export default function WishLIstContextProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [wishList, setWishList] = useState<Wishlist | null>(null);
    const [loading, setLoading] = useState(true);

    // Load wishlist from localStorage
    const loadWishList = useCallback(() => {
        try {
            const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setWishList(parsed);
            } else {
                setWishList({ status: "success", count: 0, data: [] });
            }
        } catch (error) {
            console.error("Failed to load wishlist from localStorage:", error);
            setWishList({ status: "success", count: 0, data: [] });
        } finally {
            setLoading(false);
        }
    }, []);

    // Save wishlist to localStorage
    const saveWishList = useCallback((list: Wishlist) => {
        try {
            localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(list));
        } catch (error) {
            console.error("Failed to save wishlist to localStorage:", error);
        }
    }, []);

    useEffect(() => {
        loadWishList();
    }, [loadWishList]);

    // Function to add an item
    const addItem = async (productId: string, productData?: any) => {
        if (!productData) {
            toast.error("Product data is required to add to wishlist");
            return;
        }

        const currentList = wishList || {
            status: "success",
            count: 0,
            data: [],
        };
        const isAlreadyInList = currentList.data.some(
            (item) => item.id === productId
        );

        if (isAlreadyInList) {
            toast.info("Item is already in wishlist");
            return;
        }

        const lowestPrice = getLowestPrice(productData);

        const newItem: WishlistItem = {
            sold: 0,
            images: productData.images?.map((img: any) => img.url) || [],
            subcategory: [],
            ratingsQuantity: 0,
            _id: productId,
            title: productData.name,
            slug: productData.slug,
            description: productData.description,
            quantity:
                productData.variants?.reduce(
                    (sum: number, v: any) =>
                        sum + (v.inventory?.stockOnHand || 0),
                    0
                ) || 0,
            price: Number(lowestPrice?.amount) || 0,
            imageCover: productData.images?.[0]?.url || "",
            category: productData.category || {
                id: "",
                name: "",
                slug: "",
                parentId: null,
                parent: null,
            },
            brand: { id: "", name: "", slug: "", parentId: null, parent: null },
            ratingsAverage: 0,
            createdAt: productData.createdAt,
            updatedAt: productData.updatedAt,
            __v: 0,
            id: productId,
        };

        const updatedList = {
            ...currentList,
            data: [...currentList.data, newItem],
            count: currentList.count + 1,
        };

        setWishList(updatedList);
        saveWishList(updatedList);
        toast.success("Item added to wishlist!");
    };

    // Function to remove an item
    const removeItem = async (productId: string) => {
        const currentList = wishList || {
            status: "success",
            count: 0,
            data: [],
        };
        const updatedData = currentList.data.filter(
            (item) => item.id !== productId
        );

        const updatedList = {
            ...currentList,
            data: updatedData,
            count: updatedData.length,
        };

        setWishList(updatedList);
        saveWishList(updatedList);
        toast.success("Item removed from wishlist.");
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
