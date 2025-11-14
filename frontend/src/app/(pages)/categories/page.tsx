import { Suspense } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { fetchCategories } from "@/services/categoryActions";
import { CategoryGrid } from "./_components/CategoryGrid";
import { CategoryCardSkeleton } from "./_components/CategoryCardSkeleton";
import { SearchCategories } from "./_components/SearchCategories";
import WhatsAppButton from "@/components/WhatsAppButton";

export const metadata = {
    title: "Categories | Halima E-Commerce Store",
    description: "Browse all product categories",
};

interface CategoriesPageProps {
    searchParams: {
        search?: string;
        page?: string;
    };
}

export default async function CategoriesPage({
    searchParams,
}: CategoriesPageProps) {
    const params = await searchParams;
    const { categories, meta } = await fetchCategories({
        search: params.search,
        page: params.page ? parseInt(params.page) : 1,
        limit: 12,
    });

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
            {/* Breadcrumb */}
            <div className="border-b border-border/60 bg-background/90 backdrop-blur-sm">
                <div className="mx-auto max-w-screen-2xl px-4 py-4 lg:px-8">
                    <nav className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Link
                            href="/"
                            className="transition-colors hover:text-foreground"
                        >
                            Home
                        </Link>
                        <span>/</span>
                        <span className="font-medium text-foreground">
                            Categories
                        </span>
                    </nav>
                </div>
            </div>

            {/* Header */}
            <div className="border-b border-border/60 bg-background/50">
                <div className="mx-auto max-w-screen-2xl px-4 py-8 lg:px-8 lg:py-12">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                                Categories
                            </h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Discover our curated collection of{" "}
                                {meta.totalCategories} categories
                            </p>
                        </div>

                        {/* Search */}
                        <div className="w-full sm:w-auto sm:min-w-[320px]">
                            <SearchCategories />
                        </div>
                    </div>
                </div>
            </div>

            {/* Categories Grid */}
            <div className="mx-auto max-w-screen-2xl px-4 py-8 lg:px-8 lg:py-12">
                <Suspense
                    fallback={
                        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <CategoryCardSkeleton key={i} />
                            ))}
                        </div>
                    }
                >
                    <CategoryGrid
                        categories={categories}
                        meta={meta}
                        currentSearch={params.search}
                    />
                </Suspense>
            </div>
            <WhatsAppButton variant="floating" />
        </div>
    );
}
