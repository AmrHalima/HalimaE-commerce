"use client";

/**
 * Infinite Scroll Products Component
 * Loads more products as user scrolls down
 * Uses Intersection Observer API for efficient scroll detection
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Product } from "@/interface";
import { ProductCard } from "@/components/ProductCard.server";
import { fetchProductsClient } from "@/lib/clientApi";
import { Loader2 } from "lucide-react";

interface InfiniteScrollProductsProps {
    initialProducts: Product[];
    initialPage: number;
    totalPages: number;
    totalProducts: number;
}

export function InfiniteScrollProducts({
    initialProducts,
    initialPage,
    totalPages,
    totalProducts,
}: InfiniteScrollProductsProps) {
    const searchParams = useSearchParams();
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [page, setPage] = useState(initialPage);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(initialPage < totalPages);
    const observerTarget = useRef<HTMLDivElement>(null);

    // Extract filter params
    const categoryId = searchParams.get("categoryId") || undefined;
    const search = searchParams.get("search") || undefined;
    const priceMin = searchParams.get("priceMin")
        ? parseFloat(searchParams.get("priceMin")!)
        : undefined;
    const priceMax = searchParams.get("priceMax")
        ? parseFloat(searchParams.get("priceMax")!)
        : undefined;

    // Reset products when filters change
    useEffect(() => {
        setProducts(initialProducts);
        setPage(initialPage);
        setHasMore(initialPage < totalPages);
    }, [initialProducts, initialPage, totalPages, searchParams]);

    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        try {
            const nextPage = page + 1;
            const response = await fetchProductsClient({
                page: nextPage,
                limit: 10,
                categoryId,
                search,
                priceMin,
                priceMax,
            });

            if (response.success && response.data.products.length > 0) {
                setProducts((prev) => [...prev, ...response.data.products]);
                setPage(nextPage);
                setHasMore(nextPage < response.data.meta.totalPages);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error loading more products:", error);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    }, [loading, hasMore, page, categoryId, search, priceMin, priceMax]);

    // Intersection Observer for infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    loadMore();
                }
            },
            {
                threshold: 0.1,
                rootMargin: "200px", // Start loading 200px before reaching the trigger
            }
        );

        const currentTarget = observerTarget.current;
        if (currentTarget) {
            observer.observe(currentTarget);
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget);
            }
        };
    }, [hasMore, loading, loadMore]);

    return (
        <>
            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>

            {/* Loading Indicator */}
            {loading && (
                <div className="flex justify-center items-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">
                        Loading more products...
                    </span>
                </div>
            )}

            {/* Intersection Observer Target */}
            {hasMore && !loading && (
                <div
                    ref={observerTarget}
                    className="h-20 flex justify-center items-center"
                >
                    <span className="text-sm text-muted-foreground">
                        Scroll for more
                    </span>
                </div>
            )}

            {/* End of Results */}
            {!hasMore && products.length > 0 && (
                <div className="text-center py-8 border-t mt-8">
                    <p className="text-muted-foreground">
                        You've reached the end! Showing all {totalProducts}{" "}
                        products.
                    </p>
                </div>
            )}
        </>
    );
}
