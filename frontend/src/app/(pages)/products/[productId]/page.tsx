import { notFound } from "next/navigation";
import Link from "next/link";
import { BadgeCheck, ChevronRight, Star } from "lucide-react";
import { fetchProductDetails } from "@/lib/api";
import { ensureProductImages } from "@/lib/tempImages";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductImageGallery } from "@/app/(pages)/products/[productId]/_components/ProductImageGallery";
import { ProductPurchasePanel } from "@/app/(pages)/products/[productId]/_components/ProductPurchasePanel";
import { ProductPrimaryCTA } from "@/app/(pages)/products/[productId]/_components/ProductPrimaryCTA";
import { ProductWishlistButton } from "@/app/(pages)/products/[productId]/_components/ProductWishlistButton";
import { RelatedProducts } from "@/app/(pages)/products/[productId]/_components/RelatedProducts";
import { ScrollToTop } from "@/components/ScrollToTop";
import WhatsAppButton from "@/components/WhatsAppButton";

interface ProductPageProps {
    params: {
        productId: string;
    };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ProductPageProps) {
    const product = await fetchProductDetails((await params).productId);

    if (!product) {
        return {
            title: "Product Not Found",
        };
    }

    // Use real images if available, otherwise use temporary images
    const productImages = ensureProductImages(product);

    const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : "http://localhost:3001";

    return {
        metadataBase: new URL(baseUrl),
        title: `${product.name} | Halima E-Commerce Store`,
        description: product.description || `Buy ${product.name} online`,
        openGraph: {
            title: product.name,
            description: product.description || undefined,
            images: productImages.map((img) => ({
                url: img.url,
                alt: img.alt || product.name,
            })),
        },
    };
}

export default async function ProductDetailsPage({ params }: ProductPageProps) {
    const product = await fetchProductDetails((await params).productId);

    // Show 404 if product not found or inactive
    if (!product || product.status === "INACTIVE") {
        notFound();
    }

    // Calculate product stats
    const totalStock = product.variants.reduce(
        (sum, v) => sum + (v.inventory?.stockOnHand || 0),
        0
    );
    const isOutOfStock = totalStock === 0;

    // Get first active variant for mobile CTA
    const firstActiveVariant =
        product.variants.find(
            (variant) =>
                variant.isActive && (variant.inventory?.stockOnHand || 0) > 0
        ) ||
        product.variants.find((variant) => variant.isActive) ||
        product.variants[0];

    // Get price range
    const distinctPriceValues = new Set(
        product.variants
            .flatMap((variant) => variant.prices)
            .map((price) => parseFloat(price.amount))
            .filter((amount) => !Number.isNaN(amount))
    );
    const priceRange = distinctPriceValues.size > 1;

    // Get unique attributes
    const availableSizes = [
        ...new Set(
            product.variants
                .map((v) => v.size)
                .filter((s): s is string => Boolean(s))
        ),
    ];
    const availableColors = [
        ...new Set(
            product.variants
                .map((v) => v.color)
                .filter((c): c is string => Boolean(c))
        ),
    ];
    const availableMaterials = [
        ...new Set(
            product.variants
                .map((v) => v.material)
                .filter((m): m is string => Boolean(m))
        ),
    ];

    // Use real images if available, otherwise use temporary images
    const productImages = ensureProductImages(product);
    const hasDescription = Boolean(product.description?.trim());
    const colorOverflow = Math.max(availableColors.length - 6, 0);

    const defaultVariant =
        product.variants.find(
            (variant) =>
                variant.isActive && (variant.inventory?.stockOnHand || 0) > 0
        ) ||
        product.variants.find((variant) => variant.isActive) ||
        product.variants[0];
    const defaultPrice = defaultVariant?.prices[0];
    const defaultCurrentPrice = defaultPrice
        ? parseFloat(defaultPrice.amount)
        : undefined;
    const defaultCompareAt = defaultPrice?.compareAt
        ? parseFloat(defaultPrice.compareAt)
        : undefined;
    const defaultDiscountPercentage =
        defaultCurrentPrice !== undefined &&
        defaultCompareAt !== undefined &&
        defaultCompareAt > defaultCurrentPrice
            ? Math.round(
                  ((defaultCompareAt - defaultCurrentPrice) /
                      defaultCompareAt) *
                      100
              )
            : null;

    const specificationItems = [
        {
            label: "SKU",
            value: defaultVariant?.sku || "Not assigned",
        },
        {
            label: "Materials",
            value: availableMaterials.length
                ? availableMaterials.join(", ")
                : "Premium blended fibres",
        },
        {
            label: "Variants",
            value: `${product.variants.length} curated options`,
        },
        {
            label: "Availability",
            value: isOutOfStock
                ? "Currently unavailable"
                : `${totalStock} units ready to ship`,
        },
    ];

    const highlightItems = [
        {
            title: "Thoughtful materials",
            description: availableMaterials.length
                ? availableMaterials.join(" • ")
                : "Soft-touch fabrics engineered for daily wear.",
        },
        {
            title: "Tailored fit",
            description: availableSizes.length
                ? `Available in ${availableSizes.length} sizes`
                : "Designed for a universally flattering silhouette.",
        },
        {
            title: "Flexible styling",
            description: priceRange
                ? "Mix-and-match variants with dynamic pricing."
                : "Signature look perfected in one hero variant.",
        },
    ];

    const galleryBadges = [
        defaultDiscountPercentage
            ? {
                  label: `Save ${defaultDiscountPercentage}%`,
                  tone: "accent" as const,
              }
            : null,
        isOutOfStock
            ? { label: "Out of stock", tone: "alert" as const }
            : totalStock > 0 && totalStock < 10
            ? { label: `Only ${totalStock} left`, tone: "alert" as const }
            : null,
    ].filter((badge): badge is { label: string; tone: "accent" | "alert" } =>
        Boolean(badge)
    );

    return (
        <div className="relative min-h-screen bg-gradient-to-b from-background via-background to-muted/40">
            <ScrollToTop />

            <div className="mx-auto w-full max-w-screen-2xl">
                <div className="border-b border-border/60 bg-background/90 backdrop-blur-sm">
                    <div className="px-4 py-4 lg:px-8">
                        <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <Link
                                href="/"
                                className="transition-colors hover:text-foreground"
                            >
                                Home
                            </Link>
                            <ChevronRight className="h-4 w-4" />
                            <Link
                                href="/products"
                                className="transition-colors hover:text-foreground"
                            >
                                Products
                            </Link>
                            <ChevronRight className="h-4 w-4" />
                            <span className="max-w-[240px] truncate font-medium text-foreground">
                                {product.name}
                            </span>
                        </nav>
                    </div>
                </div>

                <div className="w-full px-4 pb-28 pt-8 lg:px-8 lg:pb-8 xl:px-12">
                    <div className="grid w-full gap-8 lg:gap-12 xl:grid-cols-2 xl:items-start">
                        <div className="min-w-0 w-full space-y-6 lg:space-y-8 xl:sticky xl:top-28 xl:self-start">
                            <ProductImageGallery
                                images={productImages}
                                productName={product.name}
                                badges={galleryBadges}
                            />

                            <Card className="rounded-3xl border border-border/60 shadow-sm lg:hidden">
                                <CardHeader>
                                    <CardTitle className="text-lg">
                                        Highlights
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm text-muted-foreground">
                                    {highlightItems.map((item) => (
                                        <div
                                            key={item.title}
                                            className="space-y-1"
                                        >
                                            <p className="font-semibold text-foreground">
                                                {item.title}
                                            </p>
                                            <p>{item.description}</p>
                                        </div>
                                    ))}

                                    {availableColors.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="font-semibold text-foreground">
                                                Colour palette
                                            </p>
                                            <div className="flex flex-wrap items-center gap-2">
                                                {availableColors
                                                    .slice(0, 6)
                                                    .map((color) => (
                                                        <span
                                                            key={color}
                                                            className="h-8 w-8 rounded-full border border-border/60 bg-muted/40"
                                                            style={{
                                                                backgroundColor:
                                                                    color,
                                                            }}
                                                            aria-label={color}
                                                        />
                                                    ))}
                                                {colorOverflow > 0 && (
                                                    <span className="text-xs font-medium text-muted-foreground">
                                                        +{colorOverflow} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        <div className="min-w-0 w-full space-y-8 lg:space-y-10">
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    <Badge
                                        variant={
                                            isOutOfStock
                                                ? "destructive"
                                                : "secondary"
                                        }
                                        className="rounded-full px-3 py-1 text-xs"
                                    >
                                        {isOutOfStock
                                            ? "Out of stock"
                                            : "In stock"}
                                    </Badge>
                                    <span className="rounded-full bg-muted px-3 py-1 whitespace-nowrap">
                                        {product.variants.length} variant
                                        {product.variants.length === 1
                                            ? ""
                                            : "s"}
                                    </span>
                                    {priceRange && (
                                        <span className="rounded-full bg-muted px-3 py-1 whitespace-nowrap">
                                            Variant-specific pricing
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                                        {product.name}
                                    </h1>
                                    <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center">
                                        <div className="flex items-center gap-1">
                                            {[...Array(5)].map((_, index) => (
                                                <Star
                                                    key={index}
                                                    className={`h-4 w-4 ${
                                                        index < 4
                                                            ? "fill-yellow-400 text-yellow-400"
                                                            : "text-muted"
                                                    }`}
                                                />
                                            ))}
                                            <span className="ml-1 font-medium text-foreground">
                                                4.7/5
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                (24 verified reviews)
                                            </span>
                                        </div>
                                        <span
                                            className="hidden h-4 w-px bg-border sm:block"
                                            aria-hidden
                                        />
                                        <span className="flex items-center gap-1">
                                            <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                                            Authentic product guarantee
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <ProductPurchasePanel
                                product={product}
                                defaultVariantId={defaultVariant?.id}
                            />

                            <Card className="hidden rounded-3xl border border-border/60 shadow-sm lg:block">
                                <CardHeader>
                                    <CardTitle className="text-lg">
                                        Highlights
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-5 text-sm text-muted-foreground">
                                    {highlightItems.map((item) => (
                                        <div
                                            key={item.title}
                                            className="space-y-1"
                                        >
                                            <p className="font-semibold text-foreground">
                                                {item.title}
                                            </p>
                                            <p>{item.description}</p>
                                        </div>
                                    ))}

                                    {availableColors.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="font-semibold text-foreground">
                                                Colour palette
                                            </p>
                                            <div className="flex flex-wrap items-center gap-2">
                                                {availableColors
                                                    .slice(0, 6)
                                                    .map((color) => (
                                                        <span
                                                            key={color}
                                                            className="h-8 w-8 rounded-full border border-border/60 bg-muted/40"
                                                            style={{
                                                                backgroundColor:
                                                                    color,
                                                            }}
                                                            aria-label={color}
                                                        />
                                                    ))}
                                                {colorOverflow > 0 && (
                                                    <span className="text-xs font-medium text-muted-foreground">
                                                        +{colorOverflow} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Tabs
                                defaultValue="overview"
                                className="w-full max-w-full"
                            >
                                <TabsList className="grid w-full max-w-full grid-cols-3 rounded-full bg-muted p-1 min-h-[2.5rem]">
                                    <TabsTrigger
                                        value="overview"
                                        className="rounded-full text-xs sm:text-sm px-2 py-1.5"
                                    >
                                        Overview
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="specs"
                                        className="rounded-full text-xs sm:text-sm px-2 py-1.5"
                                    >
                                        Specs
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="shipping"
                                        className="rounded-full text-xs sm:text-sm px-2 py-1.5"
                                    >
                                        Shipping
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent
                                    value="overview"
                                    className="mt-4 rounded-3xl border border-border/60 bg-background/80 p-4 shadow-sm sm:p-6"
                                >
                                    {hasDescription ? (
                                        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                                            <p>{product.description}</p>
                                            <ul className="list-disc space-y-2 pl-5 text-muted-foreground/90">
                                                {highlightItems.map((item) => (
                                                    <li key={item.title}>
                                                        {item.description}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            Crafted with premium materials and
                                            tested for everyday performance.
                                        </p>
                                    )}
                                </TabsContent>

                                <TabsContent
                                    value="specs"
                                    className="mt-4 rounded-3xl border border-border/60 bg-background/80 p-4 shadow-sm sm:p-6"
                                >
                                    <dl className="grid gap-4 sm:grid-cols-2">
                                        {specificationItems.map((item) => (
                                            <div
                                                key={item.label}
                                                className="space-y-1"
                                            >
                                                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                                                    {item.label}
                                                </dt>
                                                <dd className="text-sm font-medium text-foreground">
                                                    {item.value}
                                                </dd>
                                            </div>
                                        ))}
                                    </dl>
                                </TabsContent>

                                <TabsContent
                                    value="shipping"
                                    className="mt-4 rounded-3xl border border-border/60 bg-background/80 p-4 shadow-sm sm:p-6"
                                >
                                    <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                                        <li>
                                            Complimentary next-day delivery
                                            within Cairo for orders above EGP
                                            500.
                                        </li>
                                        <li>
                                            Orders below the threshold ship
                                            within 1–2 business days for a flat
                                            EGP 60 fee.
                                        </li>
                                        <li>
                                            Easy 30-day returns. Items must
                                            remain unworn in original packaging.
                                        </li>
                                    </ul>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>

                    <div className="mt-16 space-y-6 lg:mt-20">
                        <div>
                            <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                                You may also like
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Curated picks inspired by similar silhouettes
                                and materials.
                            </p>
                        </div>
                        <RelatedProducts
                            currentProductId={product.id}
                            categoryId={product.categoryId}
                        />
                    </div>
                </div>
            </div>

            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 px-4 py-3 shadow-2xl backdrop-blur lg:hidden">
                <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
                    <div className="flex-1">
                        <ProductPrimaryCTA
                            variantId={firstActiveVariant?.id}
                            className="h-11"
                            disabled={isOutOfStock}
                        />
                    </div>
                    <WhatsAppButton variant="inline" />
                    <ProductWishlistButton
                        productId={product.id}
                        product={product}
                        showLabel={false}
                        className="h-11 w-12 rounded-full"
                    />
                </div>
            </div>

            {/* Floating WhatsApp button for desktop */}
            <WhatsAppButton variant="floating" />
        </div>
    );
}
