"use client";

import AddToCart from "@/app/_Components/AddToCart/AddToCart";
import Loading from "@/app/loading";
import {
    Card,
    CardContent,
    CardDescription,
    CardTitle,
} from "@/components/ui/card";
import { WishListContext } from "@/context/WishLIstContext";
import { StarIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useContext } from "react";

export default function WishList() {
    const { wishList, loading, itemCount } = useContext(WishListContext);

    if (loading) {
        return <Loading />;
    }

    if (!itemCount) {
        return (
            <div className="container mx-auto px-4 py-6 text-center">
                <h1 className="text-3xl font-bold tracking-tight mb-4">
                    Your Wishlist is Empty
                </h1>
                <p className="text-muted-foreground">
                    Looks like you haven&apos;t added anything yet.
                </p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold tracking-tight">Wishlist</h1>
            <p className="text-muted-foreground mt-1">
                {itemCount} {itemCount === 1 ? "item" : "items"} in your
                wishlist
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                {/* Items Column */}
                <div className="lg:col-span-2 space-y-4">
                    {wishList?.data.map((item) => {
                        const {
                            _id,
                            imageCover,
                            category,
                            title,
                            ratingsAverage,
                            ratingsQuantity,
                            price,
                            brand,
                            id,
                        } = item;

                        return (
                            <Card
                                key={_id}
                                className="w-full flex flex-col md:flex-row overflow-hidden"
                            >
                                <div className="relative w-full md:w-48 h-48 flex-shrink-0">
                                    <Link href={`/products/${id}`}>
                                        <Image
                                            src={imageCover}
                                            alt={title.replaceAll(" ", "-")}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 100vw, 200px"
                                        />
                                    </Link>
                                </div>

                                <CardContent className="flex flex-col justify-between p-4 flex-1">
                                    <div>
                                        <Link href={`/products/${id}`}>
                                            <CardTitle className="text-base font-semibold mb-1 hover:underline">
                                                {title}
                                            </CardTitle>
                                        </Link>
                                        <CardDescription className="text-sm mb-2">
                                            <p>{category?.name}</p>
                                            <p>Brand: {brand?.name}</p>
                                        </CardDescription>

                                        {/* Ratings */}
                                        <div className="flex items-center space-x-2 mb-2">
                                            <div className="flex">
                                                {Array.from({
                                                    length: Math.floor(
                                                        ratingsAverage
                                                    ),
                                                }).map((_, i) => (
                                                    <StarIcon
                                                        key={`filled-${i}`}
                                                        className="h-3 w-3 fill-yellow-400 text-yellow-400"
                                                    />
                                                ))}
                                                {Array.from({
                                                    length:
                                                        5 -
                                                        Math.floor(
                                                            ratingsAverage
                                                        ),
                                                }).map((_, i) => (
                                                    <StarIcon
                                                        key={`empty-${i}`}
                                                        className="h-3 w-3 text-gray-300"
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {ratingsAverage} (
                                                {ratingsQuantity} reviews)
                                            </span>
                                        </div>
                                    </div>

                                    {/* Price + AddToCart */}
                                    <div className="flex items-center justify-between mt-4">
                                        <span className="text-lg font-bold">
                                            {price} EGP
                                        </span>
                                        <AddToCart productId={id} />
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Summary Column */}
                <div className="hidden lg:block">
                    <Card className="p-4 sticky top-24">
                        <CardTitle className="text-lg mb-2">
                            Wishlist Summary
                        </CardTitle>
                        <CardDescription>
                            You have {itemCount}{" "}
                            {itemCount === 1 ? "item" : "items"} saved for
                            later.
                        </CardDescription>
                    </Card>
                </div>
            </div>
        </div>
    );
}
