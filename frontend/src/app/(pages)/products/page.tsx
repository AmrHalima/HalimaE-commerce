import ProductList from "@/app/_Components/ProductList/ProductList";
import React from "react";

export default async function products() {
    return (
        <>
            <ProductList pageNumber={1} />
        </>
    );
}
