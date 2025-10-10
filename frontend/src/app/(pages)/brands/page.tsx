import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Category } from "@/interface/category";
import Image from "next/image";
import Link from "next/link";
import React from "react";

async function getBrands(): Promise<Category[]> {
    const res = await fetch(`${process.env.API_URL}/brands`, {
        next: { revalidate: 60 * 60 * 24 * 30 }, // ISR cache: 30 days
    });

    if (!res.ok) {
        throw new Error("Failed to fetch brands");
    }

    const data = await res.json();
    return data.data as Category[];
}

export default async function AllBrands() {
    const brands = await getBrands();

    return (
        <div className="container mx-auto p-4 space-y-6">
            <h1 className="text-2xl font-bold">Brands</h1>

            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {brands.map((brand) => (
                    <Card
                        key={brand._id}
                        className="hover:shadow-lg transition rounded-2xl overflow-hidden"
                    >
                        <Link href={`/brands/${brand._id}`}>
                            <CardHeader className="p-0">
                                <Image
                                    quality={30}
                                    src={brand.image}
                                    alt={brand.name}
                                    width={400}
                                    height={200}
                                    className="w-full h-40 object-cover"
                                />
                            </CardHeader>
                            <CardContent className="p-4">
                                <CardTitle className="text-lg">
                                    {brand.name}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    {brand.slug}
                                </p>
                            </CardContent>
                        </Link>
                    </Card>
                ))}
            </div>
        </div>
    );
}
