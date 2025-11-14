/**
 * ProductsFeed Server Component
 * Main feed with server-side data fetching and grid rendering
 * Uses infinite scroll for pagination instead of traditional page buttons
 * Fetches products and categories on the server, caches for 60s
 */

import { fetchProductsFeed, fetchCategoriesForFilter } from "@/lib/api";
import { FiltersBar } from "@/components/FiltersBar.client";
import { InfiniteScrollProducts } from "@/components/InfiniteScrollProducts.client";

interface ProductsFeedProps {
    searchParams: {
        page?: string;
        categoryId?: string;
        status?: "ACTIVE" | "INACTIVE";
        search?: string;
        priceMin?: string;
        priceMax?: string;
    };
}

export async function ProductsFeed({ searchParams }: ProductsFeedProps) {
    // Parse search params
    const SParams = await searchParams;

    const page = parseInt(SParams.page || "1", 10);
    const categoryId = SParams.categoryId;
    const status = SParams.status;
    const search = SParams.search;
    const priceMin = SParams.priceMin
        ? parseFloat(SParams.priceMin)
        : undefined;
    const priceMax = SParams.priceMax
        ? parseFloat(SParams.priceMax)
        : undefined;

    // Fetch data in parallel with limit of 10 items per page
    const [productsData, categories] = await Promise.all([
        fetchProductsFeed({
            page,
            limit: 10, // 10 items per page for infinite scroll
            categoryId,
            status,
            search,
            priceMin,
            priceMax,
        }),
        fetchCategoriesForFilter(),
    ]);

    const { products, meta } = productsData;

    return (
        <div className="container mx-auto py-8 px-4">
            {/* Results Info & Filters */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold mb-2">
                        Recommended for You
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {meta.totalProducts} products available
                    </p>
                </div>
                {/* <FiltersBar categories={categories} /> */}
            </div>

            {/* Products Grid with Infinite Scroll */}
            {products.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-lg text-muted-foreground mb-2">
                        No products found
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Try adjusting your filters or search query
                    </p>
                </div>
            ) : (
                <InfiniteScrollProducts
                    initialProducts={products}
                    initialPage={meta.currentPage}
                    totalPages={meta.totalPages}
                    totalProducts={meta.totalProducts}
                />
            )}
        </div>
    );
}
