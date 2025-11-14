export function CategoryCardSkeleton() {
    return (
        <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
            {/* Image skeleton */}
            <div className="relative aspect-[4/3] overflow-hidden bg-muted/40">
                <div className="h-full w-full animate-pulse bg-gradient-to-r from-muted/20 via-muted/40 to-muted/20" />
            </div>

            {/* Content skeleton */}
            <div className="p-4 space-y-3">
                {/* Title skeleton */}
                <div className="h-5 w-3/4 animate-pulse rounded bg-muted/60" />

                {/* Meta skeleton */}
                <div className="flex items-center justify-between">
                    <div className="h-4 w-20 animate-pulse rounded bg-muted/40" />
                    <div className="h-8 w-16 animate-pulse rounded-full bg-muted/40" />
                </div>
            </div>
        </div>
    );
}
