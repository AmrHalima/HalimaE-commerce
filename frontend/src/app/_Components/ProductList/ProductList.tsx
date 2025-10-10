import { getProducts } from "@/services/getProducts";
import {
    Card,
    CardContent,
    CardDescription,
    CardTitle,
} from "@/components/ui/card";
import { Product } from "@/interface/product"; // <-- define product response interface
import { StarIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import AddToCart from "../AddToCart/AddToCart";
import AddToWishList from "../AddToWishList/AddToWishList";

export default async function ProductList({
    pageNumber,
    product,
    category,
    brand,
}: {
    product?: string;
    pageNumber?: number;
    category?: string;
    brand?: string;
}) {
    const products = (await getProducts(
        product,
        pageNumber,
        category,
        brand
    )) as Product;

    if (!products || !Array.isArray(products.data)) {
        return <div className="text-center p-10">No products found</div>;
    }

    return (
        <div className="p-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.data.map((item) => {
                const {
                    _id,
                    imageCover,
                    category,
                    title,
                    ratingsAverage,
                    ratingsQuantity,
                    price,
                    brand,
                    sold,
                    priceAfterDiscount,
                } = item;

                return (
                    <>
                        <Card
                            key={_id}
                            className="w-full overflow-hidden rounded-xl border bg-card shadow-sm transition hover:shadow-md"
                        >
                            <CardContent className="p-4">
                                {/* Image Section */}
                                <div className="relative mb-3 aspect-square overflow-hidden rounded-lg bg-muted">
                                    <AddToWishList productId={_id} />
                                    <Link href={`/products/${_id}`}>
                                        <Image
                                            src={imageCover}
                                            alt={title.replaceAll(" ", "-")}
                                            width={360}
                                            height={360}
                                            quality={75}
                                            loading="lazy"
                                            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                                        />
                                    </Link>
                                    {sold ? (
                                        <span className="absolute bottom-2 left-2 rounded-md bg-primary/90 px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
                                            {sold}+ Sold
                                        </span>
                                    ) : null}
                                </div>

                                {/* Title & Brand */}
                                <CardTitle className="mb-1 line-clamp-1 text-base font-semibold">
                                    {title}
                                </CardTitle>
                                <CardDescription className="mb-3 text-xs text-muted-foreground">
                                    <p>{category?.name}</p>
                                    <p className="text-[11px]">
                                        Brand: {brand?.name}
                                    </p>
                                </CardDescription>

                                {/* Ratings */}
                                <div className="mb-3 flex items-center gap-2">
                                    <div className="flex">
                                        {new Array(5).fill(0).map((_, i) => (
                                            <StarIcon
                                                key={i}
                                                className={`h-3.5 w-3.5 ${
                                                    i <
                                                    Math.floor(ratingsAverage)
                                                        ? "fill-yellow-400 text-yellow-400"
                                                        : "text-muted"
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {ratingsQuantity} reviews
                                    </span>
                                </div>

                                {/* Price */}
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-lg font-bold text-foreground">
                                            ${priceAfterDiscount ?? price}
                                        </span>
                                        {priceAfterDiscount ? (
                                            <span className="text-xs text-muted-foreground line-through">
                                                ${price}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-2">
                                    <AddToCart productId={_id} />
                                </div>
                            </CardContent>
                        </Card>
                    </>
                );
            })}
        </div>
    );
}
