/**
 * FiltersBar Client Component
 * Interactive filters with debounced search, category select, status, price range
 * Updates URL search params which triggers server re-render
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Filter, Search, X } from "lucide-react";

interface FiltersBarProps {
    categories: Array<{ id: string; name: string }>;
}

export function FiltersBar({ categories }: FiltersBarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Local state for inputs
    const [search, setSearch] = useState(searchParams.get("search") || "");
    const [categoryId, setCategoryId] = useState(
        searchParams.get("categoryId") || ""
    );
    const [status, setStatus] = useState(searchParams.get("status") || "");
    const [priceMin, setPriceMin] = useState(
        searchParams.get("priceMin") || ""
    );
    const [priceMax, setPriceMax] = useState(
        searchParams.get("priceMax") || ""
    );

    // Debounced search - 300ms delay
    useEffect(() => {
        const timer = setTimeout(() => {
            applyFilters({ search });
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    const applyFilters = useCallback(
        (
            overrides?: Partial<{
                search: string;
                categoryId: string;
                status: string;
                priceMin: string;
                priceMax: string;
            }>
        ) => {
            const params = new URLSearchParams();

            const filters = {
                search: overrides?.search ?? search,
                categoryId: overrides?.categoryId ?? categoryId,
                status: overrides?.status ?? status,
                priceMin: overrides?.priceMin ?? priceMin,
                priceMax: overrides?.priceMax ?? priceMax,
            };

            if (filters.search) params.set("search", filters.search);
            if (filters.categoryId)
                params.set("categoryId", filters.categoryId);
            if (filters.status) params.set("status", filters.status);
            if (filters.priceMin) params.set("priceMin", filters.priceMin);
            if (filters.priceMax) params.set("priceMax", filters.priceMax);

            // Reset to page 1 when filters change
            params.set("page", "1");

            router.push(`/products?${params.toString()}`);
        },
        [search, categoryId, status, priceMin, priceMax, router]
    );

    const clearFilters = () => {
        setSearch("");
        setCategoryId("");
        setStatus("");
        setPriceMin("");
        setPriceMax("");
        router.push("/products");
    };

    const hasActiveFilters =
        search || categoryId || status || priceMin || priceMax;

    const [showSidebar, setShowSidebar] = useState(false);

    return (
        <>
            {/* Toggle Button */}
            <div className="">
                <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowSidebar(true)}
                >
                    <Filter className="w-4 h-4" />
                </Button>
            </div>

            {/* Sidebar Overlay */}
            {showSidebar && (
                <div
                    className="fixed inset-0 z-40 bg-black/30"
                    onClick={() => setShowSidebar(false)}
                />
            )}

            {/* Sidebar */}
            <div
                className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-card border-l z-50 shadow-lg transition-transform duration-300 ${
                    showSidebar ? "translate-x-0" : "translate-x-full"
                }`}
                style={{ maxWidth: "90vw" }}
            >
                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Filters</h2>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowSidebar(false)}
                            className="text-muted-foreground"
                        >
                            <X className="w-4 h-4 mr-1" />
                            Close
                        </Button>
                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                className="text-muted-foreground ml-2"
                            >
                                <X className="w-4 h-4 mr-1" />
                                Clear All
                            </Button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {/* Search */}
                        <div className="space-y-2">
                            <Label htmlFor="search">Search</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="search"
                                    type="text"
                                    placeholder="Search products..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select
                                value={categoryId}
                                onValueChange={(value) => {
                                    setCategoryId(value);
                                    applyFilters({ categoryId: value });
                                }}
                            >
                                <SelectTrigger id="category">
                                    <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Categories
                                    </SelectItem>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={status}
                                onValueChange={(value) => {
                                    setStatus(value);
                                    applyFilters({ status: value });
                                }}
                            >
                                <SelectTrigger id="status">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Status
                                    </SelectItem>
                                    <SelectItem value="ACTIVE">
                                        Active
                                    </SelectItem>
                                    <SelectItem value="INACTIVE">
                                        Inactive
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Price Min */}
                        <div className="space-y-2">
                            <Label htmlFor="priceMin">Min Price</Label>
                            <Input
                                id="priceMin"
                                type="number"
                                placeholder="0"
                                min="0"
                                step="1"
                                value={priceMin}
                                onChange={(e) => setPriceMin(e.target.value)}
                                onBlur={() => applyFilters()}
                            />
                        </div>

                        {/* Price Max */}
                        <div className="space-y-2">
                            <Label htmlFor="priceMax">Max Price</Label>
                            <Input
                                id="priceMax"
                                type="number"
                                placeholder="∞"
                                min="0"
                                step="1"
                                value={priceMax}
                                onChange={(e) => setPriceMax(e.target.value)}
                                onBlur={() => applyFilters()}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
