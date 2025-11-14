"use client";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";
import React, { useState, useContext } from "react";
import { WishListContext } from "@/context/WishLIstContext";

export default function AddToWishList({
    productId,
    product,
}: {
    productId: string;
    product?: any;
}) {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const { addItem, removeItem, isItemInWishlist } =
        useContext(WishListContext);

    const isActive = isItemInWishlist(productId);

    async function toggle() {
        setIsLoading(true);
        try {
            if (isActive) {
                await removeItem(productId);
            } else {
                await addItem(productId, product);
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
