import { Product } from "@/interface/product";

export async function getProducts(
    product?: string,
    pageNumber?: number,
    category?: string,
    brand?: string
): Promise<Product | null> {
    try {
        const res: Response = await fetch(
            `${process.env.API_URL}/products${product ? `/${product}` : ""}${
                pageNumber ? `?page=${pageNumber}` : ""
            }${category ? `?category[in]=${category}` : ""}${
                brand ? `?brand=${brand}` : ""
            }`
        );
        if (!res.ok) {
            throw new Error("Failed to fetch data");
        }
        const products: Product = await res.json();
        return products;
    } catch (error) {
        console.log(error);
        return null;
    }
}
