"use client";

/**
 * Product Image Gallery Component
 * Features: Main image display with thumbnail navigation
 * Hover zoom effect, image switching
 */

import { useState } from "react";
import Image from "next/image";
import { ImageItem } from "@/interface";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductImageGalleryProps {
    images: ImageItem[];
    productName: string;
    badges?: Array<{ label: string; tone?: "default" | "accent" | "alert" }>;
}

export function ProductImageGallery({
    images,
    productName,
    badges = [],
}: ProductImageGalleryProps) {
    const [activeIndex, setActiveIndex] = useState(0);

    if (!images || images.length === 0) {
        return (
            <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-dashed bg-muted/20">
                <div className="text-center">
                    <ImageIcon className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                        No imagery available yet
                    </p>
                </div>
            </div>
        );
    }

    const activeImage = images[activeIndex];

    return (
        <div className="flex w-full max-w-full flex-col gap-4 lg:grid lg:grid-cols-[88px_minmax(0,1fr)] lg:items-start lg:gap-5">
            {images.length > 1 && (
                <div className="order-2 flex w-full gap-2 overflow-x-auto pb-2 scrollbar-thin lg:order-1 lg:flex-col lg:overflow-y-auto lg:pb-0 lg:max-h-[600px]">
                    {images.map((image, index) => {
                        const isActive = index === activeIndex;
                        return (
                            <button
                                key={image.id ?? `${image.url}-${index}`}
                                type="button"
                                onClick={() => setActiveIndex(index)}
                                className={cn(
                                    "group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border text-xs transition-all",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                                    isActive
                                        ? "border-primary shadow-sm ring-2 ring-primary/20"
                                        : "border-border hover:border-primary/60"
                                )}
                                aria-label={`Show image ${index + 1}`}
                                aria-pressed={isActive}
                            >
                                <Image
                                    src={image.url}
                                    alt={
                                        image.alt ||
                                        `${productName} thumbnail ${index + 1}`
                                    }
                                    fill
                                    sizes="80px"
                                    className="object-cover transition duration-200 group-hover:scale-105"
                                />
                            </button>
                        );
                    })}
                </div>
            )}

            <div className="order-1 w-full max-w-full overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-muted/40 via-background to-background shadow-sm lg:order-2">
                <div className="relative aspect-[3/3] w-full">
                    <Image
                        src={activeImage.url}
                        alt={activeImage.alt || productName}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover transition-transform duration-500 ease-out hover:scale-[1.03]"
                        priority={activeIndex === 0}
                    />

                    {badges.length > 0 && (
                        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap items-center gap-2 sm:left-4 sm:top-4">
                            {badges.map((badge) => (
                                <span
                                    key={badge.label}
                                    className={cn(
                                        "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide shadow-sm backdrop-blur sm:px-3 sm:text-xs",
                                        badge.tone === "alert"
                                            ? "bg-destructive/90 text-destructive-foreground"
                                            : badge.tone === "accent"
                                            ? "bg-primary/90 text-primary-foreground"
                                            : "bg-background/80 text-muted-foreground"
                                    )}
                                >
                                    {badge.label}
                                </span>
                            ))}
                        </div>
                    )}

                    {images.length > 0 && (
                        <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-background/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground shadow-sm backdrop-blur sm:right-4 sm:top-4 sm:px-3 sm:text-xs">
                            {activeIndex + 1}/{images.length}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
