"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebouncedCallback } from "use-debounce";

export function SearchCategories() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const [searchValue, setSearchValue] = useState(
        searchParams.get("search") || ""
    );

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);

        if (term) {
            params.set("search", term);
        } else {
            params.delete("search");
        }

        // Reset to page 1 when searching
        params.delete("page");

        startTransition(() => {
            router.push(`/categories?${params.toString()}`);
        });
    }, 300);

    const handleClear = () => {
        setSearchValue("");
        const params = new URLSearchParams(searchParams);
        params.delete("search");
        params.delete("page");
        startTransition(() => {
            router.push(`/categories?${params.toString()}`);
        });
    };

    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search categories..."
                value={searchValue}
                onChange={(e) => {
                    setSearchValue(e.target.value);
                    handleSearch(e.target.value);
                }}
                className="h-11 pl-9 pr-10"
            />
            {searchValue && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                    onClick={handleClear}
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
            {isPending && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
            )}
        </div>
    );
}
