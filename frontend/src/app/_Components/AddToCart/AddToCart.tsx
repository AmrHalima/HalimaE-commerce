"use client";
import { Button } from "@/components/ui/button";
import { CartContext } from "@/context/CartContext";
import { addToCart } from "@/services/cartActions";
import { Loader2Icon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import React, { useContext, useState } from "react";
import { toast } from "sonner";

export default function AddToCart({ productId }: { productId?: string }) {
    const [loading, setLoading] = useState<boolean>(false);
    const { setCart } = useContext(CartContext);
    const { status } = useSession();
    const router = useRouter();
    return (
        <Button
            onClick={async () => {
                if (status === "unauthenticated") {
                    router.push("/login");
                    return;
                }
                setLoading(true);
                const newCart = await addToCart(productId);
                if (newCart) {
                    setCart(newCart);
                    toast.success("Product added to cart successfully");
                } else toast.error("failed to add to cart");
                setLoading(false);
            }}
            disabled={loading ? true : false}
            variant="default"
            className="text-xs px-2 py-1 h-7"
        >
            {loading ? <Loader2Icon className="animate-spin" /> : ""}
            Add to Cart
        </Button>
    );
}
