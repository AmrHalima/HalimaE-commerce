/**
 * Product Not Found Page
 * Custom 404 for product routes
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function ProductNotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                <AlertCircle className="w-20 h-20 text-muted-foreground mx-auto mb-6" />

                <h1 className="text-4xl font-bold mb-3">Product Not Found</h1>

                <p className="text-lg text-muted-foreground mb-8">
                    Sorry, the product you're looking for doesn't exist or has
                    been removed.
                </p>

                <div className="flex gap-3 justify-center">
                    <Button asChild>
                        <Link href="/">Go Home</Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/products">Browse Products</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
