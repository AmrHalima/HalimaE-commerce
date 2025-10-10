"use client";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";
import React, { useState, useContext } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { WishListContext } from "@/context/WishLIstContext";

export default function AddToWishList({ productId }: { productId: string }) {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const { status } = useSession();
    const router = useRouter();
    const { addItem, removeItem, isItemInWishlist } =
        useContext(WishListContext);

    const isActive = isItemInWishlist(productId);

    async function toggle() {
        if (status === "unauthenticated") {
            router.push("/login");
            return;
        }
        setIsLoading(true);
        try {
            if (isActive) {
                await removeItem(productId);
            } else {
                await addItem(productId);
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Heart
            onClick={(e) => {
                e.stopPropagation();
                if (!isLoading) {
                    toggle();
                }
            }}
            className={cn(
                "absolute top-2 left-2 z-10 text-primary hover:scale-125 transition-all ease-in-out cursor-pointer",
                { "animate-pulse": isLoading }
            )}
            fill={isActive ? "#7dc9cf" : "none"}
        />
    );
}
