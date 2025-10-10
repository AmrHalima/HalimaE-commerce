import ProductList from "@/app/_Components/ProductList/ProductList";
import { Params } from "next/dist/server/request/params";
import React from "react";

export default async function BrandDetails({ params }: { params: Params }) {
    const { brandId } = await params;

    if (!brandId) return <></>;

    return (
        <div>
            {/* Products inside this brand */}
            <ProductList brand={brandId.toString()} />
        </div>
    );
}
