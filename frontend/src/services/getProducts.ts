import { Product, ProductsResponse } from "@/interface";

export async function getProducts(
    productId?: string,
    pageNumber?: number,
    category?: string,
    brand?: string
): Promise<Product | ProductsResponse | null> {
    try {
        let url = `${
            process.env.NEXT_PUBLIC_BE_BASE_URL || "http://localhost:3000"
        }/api/products`;

        if (productId) {
            url += `/${productId}`;
        } else {
            // Build query parameters for list endpoint
            const params = new URLSearchParams();
            if (pageNumber) params.append("page", pageNumber.toString());
            if (category) params.append("categoryId", category);
            // Note: brand parameter might need mapping to the new API structure

            if (params.toString()) {
                url += `?${params.toString()}`;
            }
        }

        const res: Response = await fetch(url);
        if (!res.ok) {
            throw new Error("Failed to fetch data");
        }

        const data = await res.json();

        // If fetching a single product, return the product from data
        if (productId) {
            return data.data; // Extract product from envelope
        }

        // If fetching list, return the full response
        return data;
    } catch (error) {
        console.log(error);
        return null;
    }
}
