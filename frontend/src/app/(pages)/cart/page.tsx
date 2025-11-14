"use client";

import { useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CartContext } from "@/context/CartContext";
import {
    updateCartItemQty,
    removeCartItem,
    clearCart,
    createCheckoutSession,
} from "@/services/cartActions";
import { toast } from "sonner";
import {
    Minus,
    Plus,
    Trash2,
    ShoppingCart,
    ChevronsRightIcon,
} from "lucide-react";
import Loading from "@/app/loading";

export function formatCurrency(num: number) {
    return new Intl.NumberFormat("en-EG", {
        style: "currency",
        currency: "EGP",
    }).format(num);
}

export default function Cart() {
    const { cart, setCart, loading, setLoading } = useContext(CartContext);
    const [actionLoading, setActionLoading] = useState<boolean>(false);
    const { status } = useSession();
    const router = useRouter();

    // Debug logging
    useEffect(() => {
        console.log("Cart state changed:", {
            hasCart: !!cart,
            itemCount: cart?.items?.length || 0,
            totalItems: cart?.totalItems || 0,
            loading,
            actionLoading,
        });
    }, [cart, loading, actionLoading]);

    // Calculate total price
    const calculateTotal = () => {
        if (!cart?.items) return 0;
        return cart.items.reduce((total, item) => {
            const price = parseFloat(item.variant.prices[0]?.amount || "0");
            return total + price * item.qty;
        }, 0);
    };

    const handleDecrease = async (itemId: string, currentQty: number) => {
        if (currentQty <= 1) return;

        // Store previous cart for rollback
        const previousCart = cart;

        try {
            setActionLoading(true);

            // Optimistic update
            if (cart) {
                const updatedItems = cart.items.map((item) =>
                    item.id === itemId ? { ...item, qty: currentQty - 1 } : item
                );
                setCart({ ...cart, items: updatedItems });
            }

            const newCart = await updateCartItemQty(itemId, currentQty - 1);

            console.log("API Response for decrease:", newCart);

            // Always set the cart to what the API returns
            if (newCart && newCart.items && newCart.items.length > 0) {
                setCart(newCart);
                toast.success("Quantity updated");
            } else if (
                !newCart ||
                !newCart.items ||
                newCart.items.length === 0
            ) {
                // API returned empty cart, revert to previous
                console.error("API returned empty cart, reverting");
                setCart(previousCart);
                toast.error("Cart update failed - keeping previous state");
            }
        } catch (err) {
            console.error("decrease error:", err);
            // Revert to previous cart state
            if (previousCart) {
                setCart(previousCart);
            }
            toast.error("Failed to update quantity");
        } finally {
            setActionLoading(false);
        }
    };

    const handleIncrease = async (itemId: string, currentQty: number) => {
        // Store previous cart for rollback
        const previousCart = cart;

        try {
            setActionLoading(true);

            // Optimistic update
            if (cart) {
                const updatedItems = cart.items.map((item) =>
                    item.id === itemId ? { ...item, qty: currentQty + 1 } : item
                );
                const newTotalItems = cart.items.reduce((sum, item) => {
                    if (item.id === itemId) return sum + currentQty + 1;
                    return sum + item.qty;
                }, 0);
                setCart({
                    ...cart,
                    items: updatedItems,
                    totalItems: newTotalItems,
                });
            }

            const newCart = await updateCartItemQty(itemId, currentQty + 1);

            console.log("API Response for increase:", newCart);

            // Always set the cart to what the API returns
            if (newCart && newCart.items && newCart.items.length > 0) {
                setCart(newCart);
                toast.success("Quantity updated");
            } else if (
                !newCart ||
                !newCart.items ||
                newCart.items.length === 0
            ) {
                // API returned empty cart, revert to previous
                console.error("API returned empty cart, reverting");
                setCart(previousCart);
                toast.error("Cart update failed - keeping previous state");
            }
        } catch (err) {
            console.error("increase error:", err);
            // Revert to previous cart state
            if (previousCart) {
                setCart(previousCart);
            }
            toast.error("Failed to update quantity");
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemove = async (itemId: string) => {
        // Store previous cart for rollback
        const previousCart = cart;

        try {
            setActionLoading(true);

            // Optimistic update - remove item from UI
            if (cart) {
                const updatedItems = cart.items.filter(
                    (item) => item.id !== itemId
                );
                const removedItem = cart.items.find(
                    (item) => item.id === itemId
                );
                const newTotalItems = Math.max(
                    0,
                    cart.totalItems - (removedItem?.qty || 0)
                );

                if (updatedItems.length === 0) {
                    // Last item being removed, show empty immediately
                    setCart(null);
                } else {
                    setCart({
                        ...cart,
                        items: updatedItems,
                        totalItems: newTotalItems,
                    });
                }
            }

            const newCart = await removeCartItem(itemId);

            // Update based on API response
            if (newCart && newCart.items && newCart.items.length > 0) {
                setCart(newCart);
            } else {
                // Cart is now empty
                setCart(null);
            }
            toast.success("Item removed from cart");
        } catch (err) {
            console.error("remove error:", err);
            // Revert to previous cart state
            if (previousCart) {
                setCart(previousCart);
            }
            toast.error("Failed to remove item");
        } finally {
            setActionLoading(false);
        }
    };

    const handleClearCart = async () => {
        try {
            setActionLoading(true);
            const success = await clearCart();
            if (success) {
                toast.success("Cart cleared");
                setCart(null);
            }
        } catch (err) {
            console.error("clearCart error:", err);
            toast.error("Failed to clear cart");
        } finally {
            setActionLoading(false);
        }
    };

    const handleCheckout = async () => {
        if (status !== "authenticated") {
            router.push("/login");
            return;
        }

        try {
            setLoading(true);
            if (cart) {
                const data = await createCheckoutSession(cart.id);
                if (data.status === "success" && data.session?.url) {
                    router.push(data.session.url);
                } else {
                    toast.error("Failed to create checkout session");
                }
            }
        } catch (err) {
            console.error("checkout error:", err);
            toast.error("Checkout failed");
        } finally {
            setLoading(false);
        }
    };

    if (status === "loading" || loading) {
        return <Loading />;
    }

    if (status === "unauthenticated") {
        return (
            <div className="container mx-auto px-4 py-6 text-center">
                <h1 className="text-3xl font-bold tracking-tight">Your Cart</h1>
                <p className="text-muted-foreground mt-1">
                    Please{" "}
                    <Link href="/login" className="underline">
                        login
                    </Link>{" "}
                    to see your shopping cart.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                    <Link href="/login">
                        <Button>Login</Button>
                    </Link>
                    <Link href="/register">
                        <Button variant="outline">Sign Up</Button>
                    </Link>
                </div>
            </div>
        );
    }

    // During action loading, show current cart state (don't switch to empty)
    const hasItems = !!(cart && cart.items && cart.items.length > 0);

    if (!hasItems && !actionLoading) {
        return (
            <div className="container mx-auto px-4 py-6 text-center">
                <h1 className="text-3xl font-bold tracking-tight">
                    Your Cart is Empty
                </h1>
                <p className="text-muted-foreground mt-1">
                    Looks like you haven&apos;t added anything to your cart yet.
                </p>
                <Link href={"/products"}>
                    <Button variant={"outline"} className="w-1/3 mt-4 mx-auto">
                        <ShoppingCart className="mr-2" /> Start Shopping
                    </Button>
                </Link>
            </div>
        );
    }

    // If cart becomes null during action, show loading
    if (!cart) {
        return <Loading />;
    }

    const totalPrice = calculateTotal();

    return (
        <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold tracking-tight">Shopping Cart</h1>
            <p className="text-muted-foreground mt-1">
                {cart.totalItems} {cart.totalItems === 1 ? "item" : "items"} in
                your cart
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                {/* Items Column */}
                <div className="lg:col-span-2 space-y-4">
                    {cart.items.map((item) => {
                        const price = parseFloat(
                            item.variant.prices[0]?.amount || "0"
                        );
                        const compareAtPrice = item.variant.prices[0]?.compareAt
                            ? parseFloat(item.variant.prices[0].compareAt)
                            : null;
                        const imageUrl =
                            item.variant.product.images[0]?.url ||
                            "/placeholder.png";

                        return (
                            <div
                                key={item.id}
                                className="flex gap-4 border rounded-xl p-4 shadow-sm bg-card"
                            >
                                {/* Product Image */}
                                <Link
                                    href={`/products/${item.variant.product.slug}`}
                                    className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted"
                                >
                                    <Image
                                        src={imageUrl}
                                        alt={item.variant.product.name}
                                        fill
                                        className="object-cover"
                                        sizes="96px"
                                    />
                                </Link>

                                {/* Product Details */}
                                <div className="flex-1 min-w-0">
                                    <Link
                                        href={`/products/${item.variant.product.slug}`}
                                    >
                                        <h3 className="font-semibold text-base hover:text-primary transition-colors truncate">
                                            {item.variant.product.name}
                                        </h3>
                                    </Link>

                                    {/* Variant Details */}
                                    <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                                        {item.variant.size && (
                                            <p>Size: {item.variant.size}</p>
                                        )}
                                        {item.variant.color && (
                                            <div className="flex items-center gap-2">
                                                <span>Color:</span>
                                                <div
                                                    className="w-4 h-4 rounded-full border"
                                                    style={{
                                                        backgroundColor:
                                                            item.variant.color,
                                                    }}
                                                />
                                            </div>
                                        )}
                                        {item.variant.material && (
                                            <p>
                                                Material:{" "}
                                                {item.variant.material}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground/70">
                                            SKU: {item.variant.sku}
                                        </p>
                                    </div>

                                    {/* Price & Quantity Controls */}
                                    <div className="flex items-center justify-between mt-3">
                                        <div>
                                            <div className="font-semibold text-lg">
                                                {formatCurrency(price)}
                                            </div>
                                            {compareAtPrice && (
                                                <div className="text-sm text-muted-foreground line-through">
                                                    {formatCurrency(
                                                        compareAtPrice
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {/* Quantity Controls */}
                                            <div className="flex items-center gap-2 border rounded-lg">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() =>
                                                        handleDecrease(
                                                            item.id,
                                                            item.qty
                                                        )
                                                    }
                                                    disabled={
                                                        actionLoading ||
                                                        item.qty <= 1
                                                    }
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </Button>
                                                <span className="w-8 text-center font-medium">
                                                    {item.qty}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() =>
                                                        handleIncrease(
                                                            item.id,
                                                            item.qty
                                                        )
                                                    }
                                                    disabled={actionLoading}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            {/* Remove Button */}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() =>
                                                    handleRemove(item.id)
                                                }
                                                disabled={actionLoading}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Summary Column */}
                <div className="border rounded-xl p-4 shadow-sm h-fit bg-card sticky top-24">
                    <h2 className="text-lg font-semibold mb-4">
                        Order Summary
                    </h2>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium">
                            {formatCurrency(totalPrice)}
                        </span>
                    </div>

                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Shipping</span>
                        <span className="font-medium text-muted-foreground">
                            Calculated at checkout
                        </span>
                    </div>

                    <div className="flex justify-between font-semibold text-base border-t pt-2 mt-2">
                        <span>Total</span>
                        <span className="text-primary">
                            {formatCurrency(totalPrice)}
                        </span>
                    </div>

                    <Button
                        variant="default"
                        className="w-full mt-4"
                        onClick={handleCheckout}
                        disabled={loading || actionLoading}
                    >
                        <ChevronsRightIcon className="mr-2" /> Proceed to
                        Checkout
                    </Button>

                    <Link href={"/products"}>
                        <Button variant="outline" className="w-full mt-2">
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Continue Shopping
                        </Button>
                    </Link>

                    <Button
                        variant="ghost"
                        className="w-full mt-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={handleClearCart}
                        disabled={actionLoading}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear Cart
                    </Button>
                </div>
            </div>
        </div>
    );
}
