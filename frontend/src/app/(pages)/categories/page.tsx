import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Category } from "@/interface/category";
import Loading from "@/app/loading";
import Link from "next/link";

async function getCategories() {
    const res = await fetch(`${process.env.API_URL}/categories`, {
        next: {
            revalidate: 60 * 60 * 24 * 30,
        },
    });
    if (res.ok) {
        const data = await res.json();
        return data.data as Category[];
    } else {
        throw new Error("Failed to fetch categories");
    }
}
export default async function AllCategories() {
    const categories = await getCategories();
    return (
        <>
            {categories.length === 0 ? (
                <Loading />
            ) : (
                <div className="container mx-auto p-4 space-y-6">
                    <h1 className="text-2xl font-bold">Categories</h1>
                    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {categories.map((cat) => (
                            <Card
                                key={cat._id}
                                className="hover:shadow-lg transition rounded-2xl overflow-hidden"
                            >
                                <Link href={"/categories/" + cat._id}>
                                    <CardHeader className="p-0">
                                        <Image
                                            quality={30}
                                            src={cat.image}
                                            alt={cat.name}
                                            width={400}
                                            height={200}
                                            className="w-full h-40 object-cover"
                                        />
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        <CardTitle className="text-lg">
                                            {cat.name}
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            {cat.slug}
                                        </p>
                                    </CardContent>
                                </Link>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
