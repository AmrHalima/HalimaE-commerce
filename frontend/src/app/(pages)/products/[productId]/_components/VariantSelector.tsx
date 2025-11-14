"use client";

import { useMemo } from "react";
import { Variant } from "@/interface";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type VariantAttributeKey = "size" | "color" | "material";

interface VariantSelectorProps {
    variants: Variant[];
    selectedVariant: Variant;
    onVariantChange: (variant: Variant) => void;
}

const ATTRIBUTE_LABELS: Record<VariantAttributeKey, string> = {
    size: "Size",
    color: "Color",
    material: "Material",
};

export function VariantSelector({
    variants,
    selectedVariant,
    onVariantChange,
}: VariantSelectorProps) {
    const sizes = useMemo(() => extractDistinct(variants, "size"), [variants]);
    const colors = useMemo(
        () => extractDistinct(variants, "color"),
        [variants]
    );
    const materials = useMemo(
        () => extractDistinct(variants, "material"),
        [variants]
    );

    const selectedSize = normalise(selectedVariant.size);
    const selectedColor = normalise(selectedVariant.color);
    const selectedMaterial = normalise(selectedVariant.material);

    const handleSelect = (key: VariantAttributeKey, value: string) => {
        const nextVariant = resolveVariantSelection({
            variants,
            current: selectedVariant,
            key,
            value,
        });

        if (nextVariant && nextVariant.id !== selectedVariant.id) {
            onVariantChange(nextVariant);
        } else if (nextVariant?.id === selectedVariant.id) {
            // Still notify to allow parent side-effects when re-selecting
            onVariantChange(nextVariant);
        }
    };

    return (
        <div className="space-y-5 sm:space-y-6">
            {sizes.length > 0 && (
                <VariantGroup
                    label={ATTRIBUTE_LABELS.size}
                    values={sizes}
                    selectedValue={selectedSize}
                    onSelect={(value) => handleSelect("size", value)}
                    computeState={(value) =>
                        deriveOptionState({
                            variants,
                            key: "size",
                            value,
                            selectedSize,
                            selectedColor,
                            selectedMaterial,
                        })
                    }
                    render={(value, state) => (
                        <Button
                            key={value}
                            type="button"
                            variant={state.isSelected ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleSelect("size", value)}
                            className={cn(
                                "relative min-w-[2.75rem] px-3 sm:min-w-[3rem] sm:px-4",
                                !state.isCompatible && "opacity-50",
                                !state.hasAnyStock &&
                                    "border-dashed border-destructive/40 text-muted-foreground/70"
                            )}
                            title={
                                state.hasAnyStock
                                    ? value
                                    : `${value} currently out of stock`
                            }
                        >
                            <span className="block">{value}</span>
                        </Button>
                    )}
                />
            )}

            {colors.length > 0 && (
                <VariantGroup
                    label={ATTRIBUTE_LABELS.color}
                    values={colors}
                    selectedValue={selectedColor}
                    onSelect={(value) => handleSelect("color", value)}
                    computeState={(value) =>
                        deriveOptionState({
                            variants,
                            key: "color",
                            value,
                            selectedSize,
                            selectedColor,
                            selectedMaterial,
                        })
                    }
                    render={(value, state) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => handleSelect("color", value)}
                            className={cn(
                                "relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition",
                                state.isSelected
                                    ? "border-primary ring-2 ring-primary/30"
                                    : "border-border hover:border-primary/60",
                                !state.isCompatible && "opacity-45",
                                !state.hasAnyStock && "border-destructive/50"
                            )}
                            style={{ backgroundColor: value }}
                            title={value}
                            aria-pressed={state.isSelected}
                        >
                            {!state.hasAnyStock && (
                                <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                    <span className="h-12 w-[2px] rotate-45 bg-border" />
                                </span>
                            )}
                        </button>
                    )}
                />
            )}

            {materials.length > 0 && (
                <VariantGroup
                    label={ATTRIBUTE_LABELS.material}
                    values={materials}
                    selectedValue={selectedMaterial}
                    onSelect={(value) => handleSelect("material", value)}
                    computeState={(value) =>
                        deriveOptionState({
                            variants,
                            key: "material",
                            value,
                            selectedSize,
                            selectedColor,
                            selectedMaterial,
                        })
                    }
                    render={(value, state) => (
                        <Button
                            key={value}
                            type="button"
                            variant={state.isSelected ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleSelect("material", value)}
                            className={cn(
                                "relative",
                                !state.isCompatible && "opacity-50",
                                !state.hasAnyStock &&
                                    "border-dashed border-destructive/40 text-muted-foreground/70"
                            )}
                            title={
                                state.hasAnyStock
                                    ? value
                                    : `${value} currently out of stock`
                            }
                        >
                            {value}
                            {!state.hasAnyStock && (
                                <span className="pointer-events-none absolute inset-x-2 bottom-1 text-[10px] font-medium uppercase tracking-wide text-destructive/80">
                                    Out
                                </span>
                            )}
                        </Button>
                    )}
                />
            )}
        </div>
    );
}

interface VariantGroupProps {
    label: string;
    values: string[];
    selectedValue: string | null;
    onSelect: (value: string) => void;
    computeState: (value: string) => OptionState;
    render: (value: string, state: OptionState) => JSX.Element;
}

function VariantGroup({
    label,
    values,
    selectedValue,
    render,
    computeState,
}: VariantGroupProps) {
    return (
        <div className="min-h-[4.5rem]">
            <div className="mb-2.5 flex items-center justify-between sm:mb-3">
                <Label className="text-sm font-semibold sm:text-base">
                    {label}
                </Label>
                {selectedValue && (
                    <span className="text-xs text-muted-foreground sm:text-sm">
                        {selectedValue}
                    </span>
                )}
            </div>
            <div className="flex min-h-[2.5rem] flex-wrap gap-2">
                {values.map((value) => render(value, computeState(value)))}
            </div>
        </div>
    );
}

interface OptionState {
    isSelected: boolean;
    isCompatible: boolean;
    hasAnyStock: boolean;
}

function extractDistinct(
    variants: Variant[],
    key: VariantAttributeKey
): string[] {
    const seen = new Set<string>();

    for (const variant of variants) {
        const value = normalise(variant[key]);
        if (value) {
            seen.add(value);
        }
    }

    return Array.from(seen);
}

function normalise(value?: string | null): string | null {
    return value ?? null;
}

interface OptionStateArgs {
    variants: Variant[];
    key: VariantAttributeKey;
    value: string;
    selectedSize: string | null;
    selectedColor: string | null;
    selectedMaterial: string | null;
}

function deriveOptionState({
    variants,
    key,
    value,
    selectedSize,
    selectedColor,
    selectedMaterial,
}: OptionStateArgs): OptionState {
    const isSelected =
        (key === "size" && selectedSize === value) ||
        (key === "color" && selectedColor === value) ||
        (key === "material" && selectedMaterial === value);

    const isCompatible = variants.some((variant) => {
        if (normalise(variant[key]) !== value) return false;

        if (
            key !== "size" &&
            selectedSize &&
            normalise(variant.size) !== selectedSize
        ) {
            return false;
        }
        if (
            key !== "color" &&
            selectedColor &&
            normalise(variant.color) !== selectedColor
        ) {
            return false;
        }
        if (
            key !== "material" &&
            selectedMaterial &&
            normalise(variant.material) !== selectedMaterial
        ) {
            return false;
        }
        return true;
    });

    const hasAnyStock = variants.some((variant) => {
        if (normalise(variant[key]) !== value) return false;
        return (variant.inventory?.stockOnHand || 0) > 0;
    });

    return {
        isSelected,
        isCompatible,
        hasAnyStock,
    };
}

interface ResolveArgs {
    variants: Variant[];
    current: Variant;
    key: VariantAttributeKey;
    value: string;
}

function resolveVariantSelection({
    variants,
    current,
    key,
    value,
}: ResolveArgs): Variant | undefined {
    const exactMatches = variants.filter(
        (variant) =>
            normalise(variant[key]) === value &&
            matchesOtherAttributes(variant, current, key)
    );

    if (exactMatches.length > 0) {
        return sortCandidates(exactMatches, current)[0];
    }

    const fallbackMatches = variants.filter(
        (variant) => normalise(variant[key]) === value
    );

    if (fallbackMatches.length > 0) {
        return sortCandidates(fallbackMatches, current)[0];
    }

    return current;
}

function matchesOtherAttributes(
    variant: Variant,
    current: Variant,
    excludedKey: VariantAttributeKey
): boolean {
    if (
        excludedKey !== "size" &&
        normalise(variant.size) !== normalise(current.size)
    ) {
        return false;
    }

    if (
        excludedKey !== "color" &&
        normalise(variant.color) !== normalise(current.color)
    ) {
        return false;
    }

    if (
        excludedKey !== "material" &&
        normalise(variant.material) !== normalise(current.material)
    ) {
        return false;
    }

    return true;
}

function sortCandidates(candidates: Variant[], current: Variant): Variant[] {
    return [...candidates].sort(
        (a, b) => scoreVariant(b, current) - scoreVariant(a, current)
    );
}

function scoreVariant(variant: Variant, current: Variant): number {
    let score = 0;

    if (normalise(variant.size) === normalise(current.size)) score += 4;
    if (normalise(variant.color) === normalise(current.color)) score += 4;
    if (normalise(variant.material) === normalise(current.material)) score += 2;
    if (variant.isActive) score += 1;
    if ((variant.inventory?.stockOnHand || 0) > 0) score += 2;

    return score;
}
