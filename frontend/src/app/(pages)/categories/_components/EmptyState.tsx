"use client";

import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
    searchTerm?: string;
}

export function EmptyState({ searchTerm }: EmptyStateProps) {
    const router = useRouter();

    const handleClearFilters = () => {
        router.push("/categories");
    };

    return (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Search className="h-8 w-8 text-muted-foreground" />
            </div>

            <h3 className="mt-6 text-xl font-semibold text-foreground">
                No categories found
            </h3>

            <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {searchTerm ? (
                    <>
                        We couldn't find any categories matching{" "}
                        <span className="font-semibold text-foreground">
                            "{searchTerm}"
                        </span>
                        . Try adjusting your search.
                    </>
                ) : (
                    <>
                        No categories available at the moment. Please check back
                        later.
                    </>
                )}
            </p>

            {searchTerm && (
                <Button
                    variant="outline"
                    size="lg"
                    onClick={handleClearFilters}
                    className="mt-6 gap-2"
                >
                    <X className="h-4 w-4" />
                    Clear search
                </Button>
            )}
        </div>
    );
}
