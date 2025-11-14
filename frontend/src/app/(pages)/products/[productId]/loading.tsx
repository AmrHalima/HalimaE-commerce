/**
 * Product Details Loading State
 * Skeleton UI while product data is being fetched
 */

import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function ProductLoading() {
    return (
        <div className="min-h-screen bg-background">
            {/* Breadcrumb Skeleton */}
            <div className="border-b">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center space-x-2">
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
            </div>

            {/* Main Content Skeleton */}
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* Left: Image Gallery Skeleton */}
                    <div className="space-y-4">
                        <Skeleton className="aspect-square rounded-lg" />
                        <div className="grid grid-cols-4 gap-2">
                            {[...Array(4)].map((_, i) => (
                                <Skeleton
                                    key={i}
                                    className="aspect-square rounded-md"
                                />
                            ))}
                        </div>
                    </div>

                    {/* Right: Product Info Skeleton */}
                    <div className="space-y-6">
                        {/* Title */}
                        <div className="space-y-3">
                            <Skeleton className="h-10 w-3/4" />
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-6 w-20" />
                            </div>
                            <Skeleton className="h-8 w-40" />
                        </div>

                        <Separator />

                        {/* Description */}
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>

                        {/* Variants */}
                        <div className="space-y-4">
                            <Skeleton className="h-5 w-24" />
                            <div className="flex gap-2">
                                {[...Array(5)].map((_, i) => (
                                    <Skeleton key={i} className="h-10 w-16" />
                                ))}
                            </div>
                        </div>

                        <Separator />

                        {/* Buttons */}
                        <div className="space-y-3">
                            <Skeleton className="h-12 w-full" />
                            <div className="grid grid-cols-3 gap-4">
                                {[...Array(3)].map((_, i) => (
                                    <Skeleton
                                        key={i}
                                        className="h-20 rounded-lg"
                                    />
                                ))}
                            </div>
                        </div>

                        <Separator />

                        {/* Details */}
                        <div className="space-y-3">
                            <Skeleton className="h-5 w-32" />
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="flex justify-between">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Related Products Skeleton */}
                <div className="border-t pt-12 mt-16">
                    <Skeleton className="h-8 w-48 mb-6" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="space-y-3">
                                <Skeleton className="aspect-square rounded-lg" />
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-6 w-20" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
