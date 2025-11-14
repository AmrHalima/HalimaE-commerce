/**
 * Related Products Component
 * Shows products from the same category
 * Server component with data fetching
 */

import { fetchProductsFeed } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard.server";

interface RelatedProductsProps {
    currentProductId: string;
    categoryId?: string | null;
}

export async function RelatedProducts({
    currentProductId,
    categoryId,
}: RelatedProductsProps) {
    // Fetch related products from the same category
    const { products } = await fetchProductsFeed({
        categoryId: categoryId || undefined,
        page: 1,
    });

    // Filter out the current product and limit to 4
    const relatedProducts = products
        .filter((p) => p.id !== currentProductId)
        .slice(0, 4);

    if (relatedProducts.length === 0) {
        return null;
    }

    return (
        <div className="border-t border-border/60 pt-8 sm:pt-12">
            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
                {relatedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    );
}
