/**
 * Pagination Client Component
 * Page controls with prefetching for next page
 */

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect } from "react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalProducts: number;
}

export function Pagination({
    currentPage,
    totalPages,
    totalProducts,
}: PaginationProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const goToPage = (page: number) => {
        if (page < 1 || page > totalPages) return;

        const params = new URLSearchParams(searchParams.toString());
        params.set("page", page.toString());
        router.push(`/products?${params.toString()}`);
    };

    // Prefetch next page for better UX
    useEffect(() => {
        if (currentPage < totalPages) {
            const nextPage = currentPage + 1;
            const params = new URLSearchParams(searchParams.toString());
            params.set("page", nextPage.toString());

            // Prefetch next page
            const prefetchUrl = `/products?${params.toString()}`;
            router.prefetch(prefetchUrl);
        }
    }, [currentPage, totalPages, searchParams, router]);

    if (totalPages <= 1) return null;

    // Generate page numbers to show
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const showEllipsis = totalPages > 7;

        if (!showEllipsis) {
            // Show all pages if 7 or less
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Show first, last, current, and surrounding pages
            pages.push(1);

            if (currentPage > 3) {
                pages.push("...");
            }

            for (
                let i = Math.max(2, currentPage - 1);
                i <= Math.min(totalPages - 1, currentPage + 1);
                i++
            ) {
                pages.push(i);
            }

            if (currentPage < totalPages - 2) {
                pages.push("...");
            }

            pages.push(totalPages);
        }

        return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
        <div className="flex flex-col items-center gap-4 mt-8">
            {/* Info */}
            <p className="text-sm text-muted-foreground">
                Showing page {currentPage} of {totalPages} ({totalProducts}{" "}
                total products)
            </p>

            {/* Page controls */}
            <div className="flex items-center gap-2">
                {/* Previous */}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                >
                    <ChevronLeft className="w-4 h-4" />
                </Button>

                {/* Page numbers */}
                {pageNumbers.map((page, index) => {
                    if (page === "...") {
                        return (
                            <span
                                key={`ellipsis-${index}`}
                                className="px-2 text-muted-foreground"
                            >
                                ...
                            </span>
                        );
                    }

                    const pageNum = page as number;
                    const isActive = pageNum === currentPage;

                    return (
                        <Button
                            key={pageNum}
                            variant={isActive ? "default" : "outline"}
                            size="icon"
                            onClick={() => goToPage(pageNum)}
                            aria-label={`Go to page ${pageNum}`}
                            aria-current={isActive ? "page" : undefined}
                        >
                            {pageNum}
                        </Button>
                    );
                })}

                {/* Next */}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                >
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}
