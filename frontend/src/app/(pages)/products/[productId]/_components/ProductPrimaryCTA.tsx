"use client";

import { useState, useContext, MouseEvent } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartContext } from "@/context/CartContext";
import { addToCart } from "@/services/cartActions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProductPrimaryCTAProps {
    variantId?: string;
    className?: string;
    disabled?: boolean;
}

export function ProductPrimaryCTA({
    variantId,
    className,
    disabled = false,
}: ProductPrimaryCTAProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { status } = useSession();
    const router = useRouter();
    const { cart, setCart } = useContext(CartContext);

    const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        if (isLoading || disabled || !variantId) return;

        if (status === "unauthenticated") {
            router.push("/login");
            return;
        }

        try {
            setIsLoading(true);

            // Optimistic update - increment cart count immediately
            if (cart) {
                setCart({ ...cart, totalItems: cart.totalItems + 1 });
            }

            const updatedCart = await addToCart(variantId, 1);
            if (updatedCart) {
                setCart(updatedCart);
                toast.success("Added to cart");
            } else {
                // Revert optimistic update on failure
                if (cart) {
                    setCart({
                        ...cart,
                        totalItems: Math.max(0, cart.totalItems - 1),
                    });
                }
                toast.error("Could not add this item");
            }
        } catch (error) {
            console.error("add-to-cart failed", error);
            // Revert optimistic update on error
            if (cart) {
                setCart({
                    ...cart,
                    totalItems: Math.max(0, cart.totalItems - 1),
                });
            }
            toast.error("Something went wrong. Try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            type="button"
            size="lg"
            onClick={handleClick}
            disabled={isLoading || disabled || !variantId}
            aria-busy={isLoading}
            aria-disabled={isLoading || disabled || !variantId}
            className={cn(
                "h-12 w-full gap-2 rounded-full text-sm font-semibold tracking-wide",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                disabled || !variantId ? "opacity-70" : undefined,
                className
            )}
        >
            {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
            {isLoading
                ? "Adding..."
                : !variantId
                ? "Select variant"
                : "Add to cart"}
        </Button>
    );
}
