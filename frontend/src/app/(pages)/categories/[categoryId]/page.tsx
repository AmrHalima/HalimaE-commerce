import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { fetchCategoryDetails } from "@/services/categoryActions";
import { fetchProductsFeed } from "@/lib/api";
import { ProductsFeed } from "@/components/ProductsFeed.server";
import { FiltersBar } from "@/components/FiltersBar.client";
import { InfiniteScrollProducts } from "@/components/InfiniteScrollProducts.client";
import WhatsAppButton from "@/components/WhatsAppButton";

interface CategoryPageProps {
    params: {
        categoryId: string;
    };
    searchParams: {
        page?: string;
        priceMin?: string;
        priceMax?: string;
        search?: string;
    };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: CategoryPageProps) {
    const category = await fetchCategoryDetails((await params).categoryId);

    if (!category) {
        return {
            title: "Category Not Found",
        };
    }

    const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : "http://localhost:3001";

    return {
        metadataBase: new URL(baseUrl),
        title: `${category.name} | Halima E-Commerce Store`,
        description: `Shop ${category.name} products`,
        openGraph: {
            title: category.name,
            description: `Shop ${category.name} products`,
        },
    };
}

export default async function CategoryPage({
    params,
    searchParams,
}: CategoryPageProps) {
    const awaitedParams = await params;
    const awaitedSearchParams = await searchParams;

    const category = await fetchCategoryDetails(awaitedParams.categoryId);

    if (!category) {
        notFound();
    }

    const page = awaitedSearchParams.page
        ? parseInt(awaitedSearchParams.page)
        : 1;
    const priceMin = awaitedSearchParams.priceMin
        ? parseFloat(awaitedSearchParams.priceMin)
        : undefined;
    const priceMax = awaitedSearchParams.priceMax
        ? parseFloat(awaitedSearchParams.priceMax)
        : undefined;

    const { products, meta } = await fetchProductsFeed({
        categoryId: category.id,
        page,
        limit: 12,
        priceMin,
        priceMax,
        search: awaitedSearchParams.search,
    });

    const totalProducts = meta.totalProducts || 0;

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
            {/* Breadcrumb */}
            <div className="border-b border-border/60 bg-background/90 backdrop-blur-sm">
                <div className="mx-auto max-w-screen-2xl px-4 py-4 lg:px-8">
                    <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <Link
                            href="/"
                            className="transition-colors hover:text-foreground"
                        >
                            Home
                        </Link>
                        <ChevronRight className="h-4 w-4" />
                        <Link
                            href="/categories"
                            className="transition-colors hover:text-foreground"
                        >
                            Categories
                        </Link>
                        <ChevronRight className="h-4 w-4" />
                        <span className="max-w-[240px] truncate font-medium text-foreground">
                            {category.name}
                        </span>
                    </nav>
                </div>
            </div>

            {/* Header */}
            <div className="border-b border-border/60 bg-background/50">
                <div className="mx-auto max-w-screen-2xl px-4 py-8 lg:px-8 lg:py-12">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                            {category.name}
                        </h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {totalProducts}{" "}
                            {totalProducts === 1 ? "product" : "products"}{" "}
                            available
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="mx-auto max-w-screen-2xl px-4 py-8 lg:px-8 lg:py-12">
                <div className="flex flex-col gap-8 lg:flex-row">
                    {/* Filters Sidebar */}
                    <aside className="w-full lg:w-64 lg:shrink-0">
                        <div className="sticky top-28">
                            <FiltersBar
                                currentCategoryId={category.id}
                                priceMin={priceMin}
                                priceMax={priceMax}
                            />
                        </div>
                    </aside>

                    {/* Products */}
                    <main className="min-w-0 flex-1">
                        <Suspense
                            fallback={
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="h-96 animate-pulse rounded-xl bg-muted/40"
                                        />
                                    ))}
                                </div>
                            }
                        >
                            <ProductsFeed initialProducts={products} />
                            <InfiniteScrollProducts
                                categoryId={category.id}
                                initialPage={page}
                                totalPages={meta.totalPages}
                                priceMin={priceMin}
                                priceMax={priceMax}
                                searchQuery={awaitedSearchParams.search}
                            />
                        </Suspense>
                    </main>
                </div>
            </div>
            <WhatsAppButton variant="floating" />
        </div>
    );
}
