"use client";

import Loading from "@/app/loading";
import { Button } from "@/components/ui/button";
import { CartContext } from "@/context/CartContext";
import {
    checkOutSession,
    clearCart,
    getCart,
    removeCartItem,
    updateCartItem,
} from "@/services/cartActions";
import { ChevronsRightIcon, ShoppingCart, Trash2Icon } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { toast } from "sonner";

export function formatCurrency(num: number) {
    return new Intl.NumberFormat("en-us", {
        style: "currency",
        currency: "EGP",
    }).format(num);
}

export default function Cart() {
    const { cart, setCart, loading, setLoading } = useContext(CartContext);
    const [actionLoading, setActionLoading] = useState<boolean>(false);
    const { status } = useSession();
    const router = useRouter();

    // Load cart when authenticated
    useEffect(() => {
        let mounted = true;

        async function fetchCart() {
            try {
                setLoading(true);
                const newCart = await getCart();
                if (!mounted) return;

                // sanitize: sometimes product can be a string (bad data) — filter such entries
                if (
                    newCart?.data?.products &&
                    Array.isArray(newCart.data.products)
                ) {
                    newCart.data.products = newCart.data.products.filter(
                        (p) => p && typeof p.product === "object"
                    );
                }

                setCart(newCart ?? null);
            } catch (err) {
                console.error("fetchCart error:", err);
                toast.error("Failed to fetch cart");
            } finally {
                if (mounted) setLoading(false);
            }
        }

        if (status === "authenticated") {
            fetchCart();
        } else if (status === "unauthenticated") {
            // clear cart on unauthenticated
            setCart(null);
        }

        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    // helpers for item actions
    const handleDecrease = async (productId: string, count: number) => {
        try {
            setActionLoading(true);
            const newCart = await updateCartItem(productId, count - 1);
            if (newCart?.status === "success") {
                setCart(newCart);
                toast.success("Item quantity updated");
            } else {
                toast.error("Failed to update item");
            }
        } catch (err) {
            console.error("decrease error:", err);
            toast.error("Something went wrong");
        } finally {
            setActionLoading(false);
        }
    };

    const handleIncrease = async (productId: string, count: number) => {
        try {
            setActionLoading(true);
            const newCart = await updateCartItem(productId, count + 1);
            if (newCart?.status === "success") {
                setCart(newCart);
                toast.success("Item quantity updated");
            } else {
                toast.error("Failed to update item");
            }
        } catch (err) {
            console.error("increase error:", err);
            toast.error("Something went wrong");
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemove = async (productId: string) => {
        try {
            setActionLoading(true);
            const newCart = await removeCartItem(productId);
            if (newCart?.status === "success") {
                setCart(newCart);
                toast.success("Item removed from cart");
            } else {
                toast.error("Failed to remove item");
            }
        } catch (err) {
            console.error("remove error:", err);
            toast.error("Something went wrong");
        } finally {
            setActionLoading(false);
        }
    };

    const handleClearCart = async () => {
        try {
            setActionLoading(true);
            const res = await clearCart();
            // your API returned { message: 'success' } previously — handle safely
            if (res?.message === "success" || res?.status === "success") {
                toast.success("Cart cleared");
                setCart(null);
            } else {
                toast.error("Failed to clear cart");
            }
        } catch (err) {
            console.error("clearCart error:", err);
            toast.error("Something went wrong");
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
                const data = await checkOutSession(cart?.cartId);
                if (data.status == "success") {
                    router.push(data.session.url);
                }
            }
            // checkOutSession will redirect on success
        } catch (err) {
            console.error("checkout error:", err);
            toast.error("Checkout failed");
        } finally {
            setLoading(false);
        }
    };

    // Render logic:
    // - show Loading if session or cart context is loading
    // - if unauthenticated show empty state prompting login
    // - if cart empty show empty state
    // - otherwise show cart items

    if (status === "loading" || loading) {
        return <Loading />;
    }

    if (status === "unauthenticated") {
        return (
            <div className="container mx-auto px-4 py-6 text-center">
                <h1 className="text-3xl font-bold tracking-tight">Your Cart</h1>
                <p className="text-muted-foreground mt-1">
                    Please <Link href="/login">login</Link> to see your shopping
                    cart.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                    <Link href="/login">
                        <Button variant="outline">Login</Button>
                    </Link>
                    <Link href="/register">
                        <Button>Sign Up</Button>
                    </Link>
                </div>
            </div>
        );
    }

    // At this point session is authenticated
    const hasItems = !!(cart && cart.numOfCartItems && cart.numOfCartItems > 0);

    if (!hasItems) {
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
                        <ShoppingCart /> Start Shopping
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold tracking-tight">Shopping Cart</h1>
            <p className="text-muted-foreground mt-1">
                {cart?.numOfCartItems} items in your cart
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                {/* Items Column */}
                <div className="lg:col-span-2 space-y-4">
                    {cart?.data?.products?.map(
                        ({ _id, product, price, count }) => {
                            // guard: if product is invalid, skip
                            if (!product || typeof product === "string")
                                return null;

                            return (
                                <div
                                    key={_id}
                                    className="flex gap-4 rounded-xl border p-4 shadow-sm bg-card"
                                >
                                    <Image
                                        src={product.imageCover}
                                        alt={product.title}
                                        className="w-24 h-24 rounded-lg object-cover md:w-28 md:h-28"
                                        width={100}
                                        height={100}
                                    />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                            <div className="min-w-0">
                                                <h3 className="font-semibold text-base md:text-lg line-clamp-2">
                                                    {product.title}
                                                </h3>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {product.brand?.name} ·{" "}
                                                    {product.category?.name}
                                                </p>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <div className="font-semibold">
                                                    {formatCurrency(
                                                        price * count
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Quantity Controls */}
                                        <div className="mt-3 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {count > 1 && (
                                                    <button
                                                        onClick={() =>
                                                            handleDecrease(
                                                                product._id,
                                                                count
                                                            )
                                                        }
                                                        aria-label="decrease"
                                                        className="h-8 w-8 grid place-items-center rounded-lg border hover:bg-accent"
                                                    >
                                                        –
                                                    </button>
                                                )}
                                                <span className="w-6 text-center font-medium">
                                                    {count}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        handleIncrease(
                                                            product._id,
                                                            count
                                                        )
                                                    }
                                                    aria-label="increase"
                                                    className="h-8 w-8 grid place-items-center rounded-lg border hover:bg-accent"
                                                >
                                                    +
                                                </button>
                                            </div>

                                            <button
                                                onClick={() =>
                                                    handleRemove(product._id)
                                                }
                                                aria-label="remove"
                                                className="text-destructive hover:underline text-sm"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                    )}
                </div>

                {/* Summary Column */}
                <div className="border rounded-xl p-4 shadow-sm h-fit bg-card sticky top-24">
                    <h2 className="text-lg font-semibold mb-4">
                        Order Summary
                    </h2>
                    <div className="flex justify-between text-sm mb-2">
                        <span>Subtotal {cart?.numOfCartItems} items</span>
                        <span>
                            {formatCurrency(cart?.data?.totalCartPrice ?? 0)}
                        </span>
                    </div>

                    <div className="flex justify-between text-sm mb-2">
                        <span>Shipping</span>
                        <span>{formatCurrency(0)}</span>
                    </div>

                    <div className="flex justify-between font-semibold text-base border-t pt-2">
                        <span>Total</span>
                        <span>
                            {formatCurrency(cart?.data?.totalCartPrice ?? 0)}
                        </span>
                    </div>

                    <Button
                        variant="default"
                        className="w-full mt-4"
                        onClick={handleCheckout}
                    >
                        <ChevronsRightIcon /> Proceed to Checkout
                    </Button>

                    <Link href={"/products"}>
                        <Button variant={"outline"} className="w-full mt-4">
                            <ShoppingCart /> Continue Shopping
                        </Button>
                    </Link>

                    <Button
                        variant="destructive"
                        className="w-full mt-4"
                        onClick={handleClearCart}
                    >
                        <Trash2Icon /> Clear Cart
                    </Button>
                </div>
            </div>
        </div>
    );
}
