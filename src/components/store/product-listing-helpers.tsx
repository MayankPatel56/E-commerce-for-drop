"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, SlidersHorizontal, Star, X } from "lucide-react";

interface Category {
  id: number;
  name: string;
  slug: string;
  productCount: number;
}

interface Tag {
  id: number;
  name: string;
  productCount: number;
}

interface StarRatingProps {
  rating: number;
  count: number;
}

export function StarRating({ rating, count }: StarRatingProps) {
  if (rating <= 0) return null;
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= Math.round(rating)
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/30"
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">({count})</span>
    </div>
  );
}

export function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-2 xs:gap-2.5 sm:grid-cols-2 sm:gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 lg:gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}

interface FilterSidebarContentProps {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  isFiltersLoading: boolean;
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (slug: string) => void;
  tags: Tag[];
  selectedTags: number[];
  onTagToggle: (tagId: number) => void;
  minPrice: string;
  onMinPriceChange: (val: string) => void;
  maxPrice: string;
  onMaxPriceChange: (val: string) => void;
  inStockOnly: boolean;
  onInStockOnlyChange: (checked: boolean) => void;
  sort: string;
  onSortChange: (val: string) => void;
  hasActiveFilters: boolean;
  onClearAllFilters: () => void;
  sortOptions: ReadonlyArray<{ value: string; label: string }>;
}

export function FilterSidebarContent({
  searchInput,
  onSearchInputChange,
  isFiltersLoading,
  categories,
  selectedCategory,
  onCategoryChange,
  tags,
  selectedTags,
  onTagToggle,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  inStockOnly,
  onInStockOnlyChange,
  sort,
  onSortChange,
  hasActiveFilters,
  onClearAllFilters,
  sortOptions,
}: FilterSidebarContentProps) {
  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Search</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            className="pl-9 min-h-[44px]"
          />
        </div>
      </div>

      <Separator />

      {/* Category Filter */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Category</Label>
        {isFiltersLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories</p>
        ) : (
          <div className="space-y-1 max-h-52 overflow-y-auto custom-scrollbar">
            <label
              className={`flex items-center gap-2 min-h-[40px] px-2 py-1.5 rounded-md cursor-pointer hover:bg-muted transition-colors ${
                selectedCategory === "" ? "bg-muted font-medium" : ""
              }`}
            >
              <input
                type="radio"
                name="category"
                checked={selectedCategory === ""}
                onChange={() => onCategoryChange("")}
                className="accent-primary"
              />
              <span className="text-sm">All Categories</span>
            </label>
            {categories.map((cat) => (
              <label
                key={cat.id}
                className={`flex items-center justify-between gap-2 min-h-[40px] px-2 py-1.5 rounded-md cursor-pointer hover:bg-muted transition-colors ${
                  selectedCategory === cat.slug ? "bg-muted font-medium" : ""
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === cat.slug}
                    onChange={() => onCategoryChange(cat.slug)}
                    className="accent-primary shrink-0"
                  />
                  <span className="text-sm truncate">{cat.name}</span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {cat.productCount}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Tags Filter */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            Tags{" "}
            {selectedTags.length > 0 && (
              <span className="text-muted-foreground">
                ({selectedTags.length} selected)
              </span>
            )}
          </Label>
          {selectedTags.length > 0 && (
            <button
              onClick={() => onTagToggle(-1)}
              className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline min-h-[28px]"
            >
              Clear tags
            </button>
          )}
        </div>
        {isFiltersLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : tags.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tags available</p>
        ) : (
          <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
            {tags.map((tag) => (
              <label
                key={tag.id}
                className="flex items-center justify-between gap-2 min-h-[40px] px-2 py-1.5 rounded-md cursor-pointer hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Checkbox
                    checked={selectedTags.includes(tag.id)}
                    onCheckedChange={() => onTagToggle(tag.id)}
                    className="shrink-0"
                  />
                  <span className="text-sm truncate">{tag.name}</span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {tag.productCount}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Price Range */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Price Range</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => onMinPriceChange(e.target.value)}
            className="min-h-[44px] w-full"
            min={0}
          />
          <span className="text-muted-foreground text-sm">-</span>
          <Input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(e.target.value)}
            className="min-h-[44px] w-full"
            min={0}
          />
        </div>
      </div>

      <Separator />

      {/* In Stock Only */}
      <div className="flex items-center justify-between min-h-[44px]">
        <Label htmlFor="in-stock-switch" className="text-sm font-medium cursor-pointer">
          In Stock Only
        </Label>
        <input
          id="in-stock-switch"
          type="checkbox"
          checked={inStockOnly}
          onChange={(e) => onInStockOnlyChange(e.target.checked)}
          className="cursor-pointer"
        />
      </div>

      <Separator />

      {/* Sort By */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Sort By</Label>
        <Select value={sort} onValueChange={onSortChange}>
          <SelectTrigger className="min-h-[44px] w-full">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Clear All Filters */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          className="w-full min-h-[44px]"
          onClick={onClearAllFilters}
        >
          <X className="h-4 w-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  );
}
