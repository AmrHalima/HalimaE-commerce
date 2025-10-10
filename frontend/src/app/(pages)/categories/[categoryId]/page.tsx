import ProductList from "@/app/_Components/ProductList/ProductList";
import { Params } from "next/dist/server/request/params";
import React from "react";

export default async function categoryDetails({ params }: { params: Params }) {
    const { categoryId } = await params;

    if (!categoryId) return <></>;

    return (
        <div>
            {/* Products inside this category */}
            <ProductList category={categoryId.toString()} />
        </div>
    );
}
