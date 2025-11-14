"use client";

import Link from "next/link";
import Image from "next/image";
import { Category } from "@/interface/category";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
    category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
    // Use temp images from public/temp-images
    const getCategoryImage = (categoryId: string) => {
        const tempImages = [
            "/temp-images/product-1.png",
            "/temp-images/product-2.jpg",
            "/temp-images/product-3.jpg",
            "/temp-images/product-4.png",
            "/temp-images/product-5.jpg",
        ];
        // Cycle through images based on category ID (convert string to number for indexing)
        const idNumber = parseInt(categoryId) || 1;
        const imageIndex = (idNumber - 1) % tempImages.length;
        return tempImages[imageIndex];
    };

    return (
        <Link
            href={`/categories/${category.id}`}
            className="group block h-full"
        >
            <Card className="h-full overflow-hidden border border-border/60 bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/40">
                <CardContent className="p-0">
                    {/* Image */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-muted/40 via-background to-background">
                        <Image
                            src={getCategoryImage(category.id)}
                            alt={category.name}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-3">
                        {/* Title */}
                        <h3 className="line-clamp-2 text-base font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
                            {category.name}
                        </h3>

                        {/* Meta info */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Package className="h-3.5 w-3.5" />
                                <span>View collection</span>
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 rounded-full px-3 text-xs group-hover:bg-primary group-hover:text-primary-foreground"
                            >
                                Browse
                                <ChevronRight className="ml-1 h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
