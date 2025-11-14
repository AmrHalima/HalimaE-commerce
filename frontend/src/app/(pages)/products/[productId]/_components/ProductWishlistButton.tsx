"use client";

import { useState, useContext, MouseEvent } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WishListContext } from "@/context/WishLIstContext";
import { cn } from "@/lib/utils";

interface ProductWishlistButtonProps {
    productId: string;
    product?: unknown;
    className?: string;
    showLabel?: boolean;
}

export function ProductWishlistButton({
    productId,
    product,
    className,
    showLabel = true,
}: ProductWishlistButtonProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const { addItem, removeItem, isItemInWishlist } =
        useContext(WishListContext);
    const isActive = isItemInWishlist(productId);

    const toggleWishlist = async (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        if (isProcessing) return;

        setIsProcessing(true);
        try {
            if (isActive) {
                await removeItem(productId);
            } else {
                await addItem(productId, product);
            }
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={toggleWishlist}
            disabled={isProcessing}
            aria-pressed={isActive}
            className={cn(
                "h-12 w-full gap-2 rounded-full text-sm font-semibold",
                "border-2",
                isActive
                    ? "border-primary/70 bg-primary/10 text-primary hover:bg-primary/15"
                    : "border-border/70 text-muted-foreground hover:border-primary/40 hover:text-primary",
                className
            )}
        >
            <Heart
                className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "fill-current" : undefined
                )}
            />
            {showLabel && (isActive ? "Saved" : "Save")}
        </Button>
    );
}
