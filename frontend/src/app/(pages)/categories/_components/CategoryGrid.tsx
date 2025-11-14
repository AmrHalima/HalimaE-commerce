import { Category } from "@/interface/category";
import { CategoryCard } from "./CategoryCard";
import { EmptyState } from "./EmptyState";

interface CategoryGridProps {
    categories: Category[];
    meta: {
        totalCategories: number;
        totalPages: number;
        currentPage: number;
    };
    currentSearch?: string;
}

export function CategoryGrid({
    categories,
    meta,
    currentSearch,
}: CategoryGridProps) {
    if (categories.length === 0) {
        return <EmptyState searchTerm={currentSearch} />;
    }

    return (
        <div>
            {/* Results header */}
            <div className="mb-6 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {currentSearch ? (
                        <>
                            Found{" "}
                            <span className="font-semibold text-foreground">
                                {meta.totalCategories}
                            </span>{" "}
                            {meta.totalCategories === 1
                                ? "category"
                                : "categories"}{" "}
                            for{" "}
                            <span className="font-semibold text-foreground">
                                "{currentSearch}"
                            </span>
                        </>
                    ) : (
                        <>
                            Showing{" "}
                            <span className="font-semibold text-foreground">
                                {categories.length}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-foreground">
                                {meta.totalCategories}
                            </span>{" "}
                            categories
                        </>
                    )}
                </p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
                {categories.map((category) => (
                    <CategoryCard key={category.id} category={category} />
                ))}
            </div>

            {/* Load more indicator */}
            {meta.currentPage < meta.totalPages && (
                <div className="mt-12 text-center">
                    <p className="text-sm text-muted-foreground">
                        Page {meta.currentPage} of {meta.totalPages}
                    </p>
                </div>
            )}
        </div>
    );
}
