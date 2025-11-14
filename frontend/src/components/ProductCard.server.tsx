/**
 * ProductCard Server Component
 * Pure server-rendered product card with image, name, price, badges
 * NO event handlers - completely static and cacheable
 */

import { Product } from "@/interface";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { getLowestPrice, getTotalStock, formatPrice } from "@/lib/api";
import { ensureProductImages } from "@/lib/tempImages";

interface ProductCardProps {
    product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
    const lowestPrice = getLowestPrice(product);
    const totalStock = getTotalStock(product);

    // Use real images if available, otherwise use temporary images
    const productImages = ensureProductImages(product);
    const firstImage = productImages[0];
    const secondImage = productImages.length > 1 ? productImages[1] : null;

    const isOutOfStock = totalStock === 0;
    const isInactive = product.status === "INACTIVE";

    // Extract unique colors from variants
    const availableColors = product.variants
        ? [
              ...new Set(
                  product.variants
                      .map((v) => v.color)
                      .filter((c): c is string => Boolean(c))
              ),
          ]
        : [];

    return (
        <Card className="group w-full h-full overflow-hidden rounded-xl border bg-card transition-all duration-300 hover:shadow-md">
            <CardContent className="p-0 flex flex-col h-full">
                {/* Image Section */}
                <div className="relative aspect-square overflow-hidden bg-muted">
                    <Link
                        href={`/products/${product.id}`}
                        aria-label={`View details for ${product.name}`}
                    >
                        <div className="relative h-full w-full group">
                            {firstImage ? (
                                <Image
                                    src={firstImage.url}
                                    alt={
                                        firstImage.alt ||
                                        `Photo of ${product.name}`
                                    }
                                    fill
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                    className="object-cover transition-opacity duration-300"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">
                                    No Image
                                </div>
                            )}
                            {secondImage && (
                                <Image
                                    src={secondImage.url}
                                    alt={
                                        secondImage.alt ||
                                        `Alternate view of ${product.name}`
                                    }
                                    fill
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                    className="absolute inset-0 object-cover transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                                    loading="lazy"
                                />
                            )}
                        </div>
                    </Link>

                    {/* Status Badges */}
                    <div className="absolute bottom-2 right-2 flex flex-col gap-1">
                        {isInactive && (
                            <Badge variant="secondary" className="text-xs">
                                Inactive
                            </Badge>
                        )}
                        {isOutOfStock && (
                            <Badge variant="destructive" className="text-xs">
                                Out of Stock
                            </Badge>
                        )}
                    </div>

                    {/* Stock indicator */}
                    {!isOutOfStock && totalStock < 10 && (
                        <Badge
                            variant="outline"
                            className="absolute bottom-2 left-2 text-xs bg-background/90"
                        >
                            Only {totalStock} left
                        </Badge>
                    )}
                </div>

                {/* Product Info */}
                <div className="p-4 space-y-3 flex-grow flex flex-col">
                    {/* Title */}
                    <h3
                        id={`product-title-${product.id}`}
                        className="line-clamp-2 text-base font-semibold leading-tight hover:text-primary transition-colors"
                    >
                        {product.name}
                    </h3>

                    {/* Price */}
                    {lowestPrice ? (
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold text-foreground">
                                {formatPrice(
                                    lowestPrice.amount,
                                    lowestPrice.currency
                                )}
                            </span>
                            {lowestPrice.compareAt && (
                                <>
                                    <span className="text-sm text-muted-foreground line-through">
                                        {formatPrice(
                                            lowestPrice.compareAt,
                                            lowestPrice.currency
                                        )}
                                    </span>
                                    <Badge
                                        variant="destructive"
                                        className="text-xs"
                                    >
                                        {Math.round(
                                            ((Number(lowestPrice.compareAt) -
                                                Number(lowestPrice.amount)) /
                                                Number(lowestPrice.compareAt)) *
                                                100
                                        )}
                                        % OFF
                                    </Badge>
                                </>
                            )}
                        </div>
                    ) : (
                        <span className="text-sm text-muted-foreground">
                            Price not available
                        </span>
                    )}

                    {/* Description */}
                    {product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                            {product.description}
                        </p>
                    )}

                    {/* Variants Colors */}
                    <div className="flex items-center justify-between gap-2 mt-auto pt-2">
                        {/* Available Colors */}
                        {availableColors.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                {availableColors
                                    .slice(0, 4)
                                    .map((colorName, index) => (
                                        <div
                                            key={index}
                                            className="w-6 h-6 rounded-full border-2 border-gray-200 shadow-sm"
                                            style={{
                                                backgroundColor: colorName,
                                            }}
                                            title={colorName}
                                        ></div>
                                    ))}
                                {availableColors.length > 4 && (
                                    <span className="text-xs text-muted-foreground ml-1">
                                        +{availableColors.length - 4}
                                    </span>
                                )}
                            </div>
                        )}
                        
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
