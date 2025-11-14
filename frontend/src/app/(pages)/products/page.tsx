import { ProductsFeed } from "@/components/ProductsFeed.server";
import WhatsAppButton from "@/components/WhatsAppButton";

interface ProductsPageProps {
    searchParams: {
        page?: string;
        categoryId?: string;
        status?: "ACTIVE" | "INACTIVE";
        search?: string;
        priceMin?: string;
        priceMax?: string;
    };
}

export default async function ProductsPage({
    searchParams,
}: ProductsPageProps) {
    return (
        <>
            <ProductsFeed searchParams={searchParams} />
            <WhatsAppButton variant="floating" />
        </>
    );
}
