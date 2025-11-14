/**
 * Temporary Image Helper
 * Provides fallback images for products until backend returns real images
 *
 * TEMPORARY SOLUTION:
 * - Images are stored in /public/temp-images/ folder
 * - 5 static images (product-1.png, product-2.jpg, product-3.jpg, product-4.png, product-5.jpg)
 * - Supports any image format (jpg, png, webp, etc.)
 * - Each product gets all 5 images in a consistent, hash-based order
 * - When backend starts returning real images, this helper will automatically use them
 *
 * USAGE:
 * - ensureProductImages(product) - Returns real images if available, otherwise temp images
 * - All 5 temp images are assigned to every product for gallery display
 *
 * TO ADD MORE IMAGES:
 * 1. Add image files to /public/temp-images/ (any format: jpg, png, webp, etc.)
 * 2. Update the TEMP_IMAGES array below with the new paths
 * 3. Update the getTempImagesForProduct function to return more images
 */

import { ImageItem } from "@/interface";

// Temporary static images (supports any format: jpg, png, etc.)
const TEMP_IMAGES = [
    "/temp-images/product-1.png",
    "/temp-images/product-2.jpg",
    "/temp-images/product-3.jpg",
    "/temp-images/product-4.png",
    "/temp-images/product-5.jpg",
];

/**
 * Get temporary images for a product
 * Uses product ID hash to consistently assign the same images to the same product
 * Returns all 5 images for consistent gallery display
 */
export function getTempImagesForProduct(productId: string): ImageItem[] {
    // Create a simple hash from product ID to consistently assign images
    let hash = 0;
    for (let i = 0; i < productId.length; i++) {
        hash = (hash << 5) - hash + productId.charCodeAt(i);
        hash = hash & hash; // Convert to 32-bit integer
    }

    // Use hash to determine starting index (0-4)
    const startIndex = Math.abs(hash) % TEMP_IMAGES.length;

    // Return all 5 images in a rotated order based on the hash
    return [
        {
            id: `temp-${productId}-1`,
            url: TEMP_IMAGES[startIndex],
            alt: "Product image 1",
        },
        {
            id: `temp-${productId}-2`,
            url: TEMP_IMAGES[(startIndex + 1) % TEMP_IMAGES.length],
            alt: "Product image 2",
        },
        {
            id: `temp-${productId}-3`,
            url: TEMP_IMAGES[(startIndex + 2) % TEMP_IMAGES.length],
            alt: "Product image 3",
        },
        {
            id: `temp-${productId}-4`,
            url: TEMP_IMAGES[(startIndex + 3) % TEMP_IMAGES.length],
            alt: "Product image 4",
        },
        {
            id: `temp-${productId}-5`,
            url: TEMP_IMAGES[(startIndex + 4) % TEMP_IMAGES.length],
            alt: "Product image 5",
        },
    ];
}

/**
 * Ensure product has images - use real images if available, otherwise use temp images
 */
export function ensureProductImages(product: {
    id: string;
    images: ImageItem[];
    name: string;
}): ImageItem[] {
    if (product.images && product.images.length > 0) {
        return product.images;
    }

    return getTempImagesForProduct(product.id);
}
