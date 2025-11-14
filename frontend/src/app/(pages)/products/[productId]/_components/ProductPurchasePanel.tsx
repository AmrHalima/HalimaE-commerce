"use client";

import { useEffect, useMemo, useState } from "react";
import { Package, ShieldCheck, Truck } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Product, Variant } from "@/interface";
import { formatPrice } from "@/lib/api";
import { VariantSelector } from "./VariantSelector";
import { ProductPrimaryCTA } from "./ProductPrimaryCTA";
import { ProductWishlistButton } from "./ProductWishlistButton";
import { cn } from "@/lib/utils";

interface ProductPurchasePanelProps {
    product: Product;
    defaultVariantId?: string;
}

interface AssuranceHighlight {
    title: string;
    description: string;
    icon: typeof Truck;
}

const ASSURANCE_CARDS: AssuranceHighlight[] = [
    {
        icon: Truck,
        title: "Fast delivery",
        description: "Complimentary shipping on orders from EGP 500.",
    },
    {
        icon: ShieldCheck,
        title: "Secure checkout",
        description: "Payment protected by bank-grade encryption.",
    },
    {
        icon: Package,
        title: "Easy returns",
        description: "30-day hassle-free exchanges and refunds.",
    },
];

function pickDefaultVariant(
    variants: Variant[],
    defaultId?: string
): Variant | undefined {
    if (!variants.length) return undefined;

    if (defaultId) {
        const fromId = variants.find((variant) => variant.id === defaultId);
        if (fromId) return fromId;
    }

    return (
        variants.find(
            (variant) =>
                variant.isActive && (variant.inventory?.stockOnHand || 0) > 0
        ) ||
        variants.find((variant) => variant.isActive) ||
        variants[0]
    );
}

export function ProductPurchasePanel({
    product,
    defaultVariantId,
}: ProductPurchasePanelProps) {
    const initialVariant = useMemo(
        () => pickDefaultVariant(product.variants, defaultVariantId),
        [product.variants, defaultVariantId]
    );

    const [selectedVariant, setSelectedVariant] = useState<Variant | undefined>(
        initialVariant
    );

    useEffect(() => {
        setSelectedVariant(initialVariant);
    }, [initialVariant?.id]);

    if (!selectedVariant) {
        return null;
    }

    const activePrice = selectedVariant.prices?.[0];
    const compareAtPrice = activePrice?.compareAt
        ? formatPrice(activePrice.compareAt, activePrice.currency)
        : null;
    const formattedPrice = activePrice
        ? formatPrice(activePrice.amount, activePrice.currency)
        : undefined;
    const numericActivePrice = activePrice
        ? parseFloat(activePrice.amount)
        : undefined;
    const numericCompareAt = activePrice?.compareAt
        ? parseFloat(activePrice.compareAt)
        : undefined;
    const discountPercentage =
        numericActivePrice &&
        numericCompareAt &&
        numericCompareAt > numericActivePrice
            ? Math.round(
                  ((numericCompareAt - numericActivePrice) / numericCompareAt) *
                      100
              )
            : null;

    const stockCount = selectedVariant.inventory?.stockOnHand ?? 0;
    const isPurchasable = selectedVariant.isActive && stockCount > 0;

    const selectionSummary = [
        selectedVariant.size,
        selectedVariant.color,
        selectedVariant.material,
    ]
        .filter(Boolean)
        .join(" • ");

    return (
        <Card className="w-full max-w-full rounded-3xl border border-border/60 shadow-sm">
            <CardHeader className="space-y-3 pb-4">
                <div className="flex flex-wrap items-baseline gap-3 min-h-[3rem]">
                    <span className="text-3xl font-bold text-foreground sm:text-4xl">
                        {formattedPrice || "—"}
                    </span>
                    {compareAtPrice && (
                        <span className="text-base text-muted-foreground line-through sm:text-lg">
                            {compareAtPrice}
                        </span>
                    )}
                    {discountPercentage && (
                        <Badge
                            variant="destructive"
                            className="rounded-full px-2.5 py-1 text-xs font-bold uppercase sm:px-3"
                        >
                            Save {discountPercentage}%
                        </Badge>
                    )}
                </div>
                <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center">
                    <span
                        className={cn(
                            "font-medium",
                            isPurchasable
                                ? "text-emerald-600"
                                : "text-destructive"
                        )}
                    >
                        {isPurchasable
                            ? `${stockCount} in stock`
                            : "Currently unavailable"}
                    </span>
                    {selectionSummary && (
                        <>
                            <span className="hidden text-muted-foreground/60 sm:inline">
                                •
                            </span>
                            <span className="text-muted-foreground/80">
                                {selectionSummary}
                            </span>
                        </>
                    )}
                    <span className="hidden text-muted-foreground/60 sm:inline">
                        •
                    </span>
                    <span className="text-muted-foreground/80">
                        SKU {selectedVariant.sku}
                    </span>
                </div>
            </CardHeader>
            <CardContent className="space-y-5 sm:space-y-6">
                <VariantSelector
                    variants={product.variants}
                    selectedVariant={selectedVariant}
                    onVariantChange={setSelectedVariant}
                />

                <div className="rounded-2xl border border-border/60 bg-muted/30 p-3.5 text-sm text-muted-foreground sm:p-4">
                    <dl className="grid gap-3 sm:grid-cols-2">
                        <div className="min-h-[2.5rem]">
                            <dt className="text-xs uppercase tracking-wide">
                                Selected SKU
                            </dt>
                            <dd className="mt-1 font-medium text-foreground">
                                {selectedVariant.sku}
                            </dd>
                        </div>
                        <div className="min-h-[2.5rem]">
                            <dt className="text-xs uppercase tracking-wide">
                                Availability
                            </dt>
                            <dd className="mt-1 font-medium text-foreground">
                                {isPurchasable ? (
                                    <span className="text-emerald-600">
                                        Ready to ship ({stockCount} available)
                                    </span>
                                ) : (
                                    <span className="text-destructive">
                                        Out of stock
                                    </span>
                                )}
                            </dd>
                        </div>
                        {selectionSummary && (
                            <div className="min-h-[2.5rem] sm:col-span-2">
                                <dt className="text-xs uppercase tracking-wide">
                                    Configuration
                                </dt>
                                <dd className="mt-1 font-medium text-foreground">
                                    {selectionSummary}
                                </dd>
                            </div>
                        )}
                    </dl>
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <ProductPrimaryCTA
                        variantId={selectedVariant?.id}
                        disabled={!isPurchasable}
                    />
                    <ProductWishlistButton
                        productId={product.id}
                        product={product}
                        className="sm:w-[180px]"
                    />
                </div>

                <p className="text-xs leading-relaxed text-muted-foreground">
                    Free shipping over EGP 500 • 30-day returns • Secure
                    checkout
                </p>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {ASSURANCE_CARDS.map(
                        ({ icon: Icon, title, description }) => (
                            <div
                                key={title}
                                className="flex items-start gap-2.5 rounded-2xl border border-border/60 bg-background/80 p-3 sm:gap-3 sm:p-3.5"
                            >
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary sm:h-10 sm:w-10">
                                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                                </span>
                                <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
                                    <p className="text-xs font-semibold text-foreground sm:text-sm">
                                        {title}
                                    </p>
                                    <p className="text-xs leading-relaxed text-muted-foreground break-words">
                                        {description}
                                    </p>
                                </div>
                            </div>
                        )
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
