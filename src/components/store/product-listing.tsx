"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Search,
  SlidersHorizontal,
  X,
  Star,
  Package,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import Image from "next/image";

// --- Interfaces ---

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

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  primaryImage: string | null;
  category: { name: string; slug: string } | null;
  inStock: boolean;
  reviewCount: number;
  averageRating: number;
  tags: { id: number; name: string }[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ProductListingProps {
  initialCategory?: string;
  onNavigate: (view: string, data?: Record<string, unknown>) => void;
}

// --- Sort option labels ---
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name_asc", label: "Name: A-Z" },
] as const;

// --- Component ---

export function ProductListing({
  initialCategory,
  onNavigate,
}: ProductListingProps) {
  // Filter state
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialCategory || ""
  );
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const limit = 20;

  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltersLoading, setIsFiltersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mobile sheet
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Ref for tracking if search debounce fired after initial mount
  const mountedRef = useRef(false);

  // Sync initialCategory prop changes
  useEffect(() => {
    if (initialCategory !== undefined) {
      setSelectedCategory(initialCategory);
      setPage(1);
    }
  }, [initialCategory]);

  // --- Fetch categories & tags ---
  useEffect(() => {
    const fetchFilters = async () => {
      setIsFiltersLoading(true);
      try {
        const [catRes, tagRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/tags"),
        ]);
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData);
        }
        if (tagRes.ok) {
          const tagData = await tagRes.json();
          setTags(tagData);
        }
      } catch {
        // Silent — filters are non-critical
      } finally {
        setIsFiltersLoading(false);
      }
    };
    fetchFilters();
  }, []);

  // --- Debounced search (400ms) ---
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // --- Fetch products ---
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedCategory) params.set("category", selectedCategory);
      if (selectedTags.length > 0)
        params.set("tags", selectedTags.join(","));
      if (inStockOnly) params.set("inStock", "true");
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      params.set("sort", sort);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch products");

      const data = await res.json();
      setProducts(data.products || []);
      setPagination(
        data.pagination || { page: 1, limit, total: 0, totalPages: 0 }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedCategory, selectedTags, inStockOnly, minPrice, maxPrice, sort, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // --- Tag toggle (OR logic multi-select) ---
  const toggleTag = (tagId: number) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
    setPage(1);
  };

  // --- Clear all filters ---
  const clearAllFilters = () => {
    setSearch("");
    setSearchInput("");
    setSelectedCategory("");
    setSelectedTags([]);
    setMinPrice("");
    setMaxPrice("");
    setInStockOnly(false);
    setSort("newest");
    setPage(1);
  };

  // --- Has active filters ---
  const hasActiveFilters =
    search !== "" ||
    selectedCategory !== "" ||
    selectedTags.length > 0 ||
    minPrice !== "" ||
    maxPrice !== "" ||
    inStockOnly;

  // --- Price helpers ---
  const handleMinPriceChange = (val: string) => {
    setMinPrice(val);
    setPage(1);
  };

  const handleMaxPriceChange = (val: string) => {
    setMaxPrice(val);
    setPage(1);
  };

  // --- Pagination helpers ---
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getVisiblePageNumbers = (): number[] => {
    const { page: current, totalPages: total } = pagination;
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: number[] = [];
    let start = Math.max(1, current - 2);
    const end = Math.min(total, start + 4);
    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const showingFrom =
    pagination.total === 0
      ? 0
      : (pagination.page - 1) * pagination.limit + 1;
  const showingTo = Math.min(
    pagination.page * pagination.limit,
    pagination.total
  );

  // --- Star rating component ---
  const StarRating = ({ rating, count }: { rating: number; count: number }) => {
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
  };

  // --- Skeleton grid ---
  const SkeletonGrid = () => (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      ))}
    </div>
  );

  // --- Filter sidebar content (shared between desktop & mobile) ---
  const FilterSidebarContent = () => (
    <div className="space-y-6">
      {/* Search */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Search</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 min-h-[44px]"
          />
        </div>
      </div>

      <Separator />

      {/* Category Filter */}
      <div className="space-y-2">
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
              className={`flex items-center gap-2 min-h-[36px] px-2 py-1.5 rounded-md cursor-pointer hover:bg-muted transition-colors ${
                selectedCategory === "" ? "bg-muted font-medium" : ""
              }`}
            >
              <input
                type="radio"
                name="category"
                checked={selectedCategory === ""}
                onChange={() => {
                  setSelectedCategory("");
                  setPage(1);
                }}
                className="accent-primary"
              />
              <span className="text-sm">All Categories</span>
            </label>
            {categories.map((cat) => (
              <label
                key={cat.id}
                className={`flex items-center justify-between gap-2 min-h-[36px] px-2 py-1.5 rounded-md cursor-pointer hover:bg-muted transition-colors ${
                  selectedCategory === cat.slug ? "bg-muted font-medium" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === cat.slug}
                    onChange={() => {
                      setSelectedCategory(cat.slug);
                      setPage(1);
                    }}
                    className="accent-primary"
                  />
                  <span className="text-sm truncate">{cat.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {cat.productCount}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Tags Filter */}
      <div className="space-y-2">
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
              onClick={() => {
                setSelectedTags([]);
                setPage(1);
              }}
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
                className="flex items-center justify-between gap-2 min-h-[36px] px-2 py-1.5 rounded-md cursor-pointer hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedTags.includes(tag.id)}
                    onCheckedChange={() => toggleTag(tag.id)}
                  />
                  <span className="text-sm truncate">{tag.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {tag.productCount}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Price Range */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Price Range</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => handleMinPriceChange(e.target.value)}
            className="min-h-[44px] w-full"
            min={0}
          />
          <span className="text-muted-foreground text-sm">-</span>
          <Input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => handleMaxPriceChange(e.target.value)}
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
        <Switch
          id="in-stock-switch"
          checked={inStockOnly}
          onCheckedChange={(checked) => {
            setInStockOnly(checked);
            setPage(1);
          }}
        />
      </div>

      <Separator />

      {/* Sort By */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Sort By</Label>
        <Select
          value={sort}
          onValueChange={(val) => {
            setSort(val);
            setPage(1);
          }}
        >
          <SelectTrigger className="min-h-[44px] w-full">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
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
          onClick={clearAllFilters}
        >
          <X className="h-4 w-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* --- Desktop Sidebar --- */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal className="h-4 w-4" />
            <h2 className="font-semibold text-sm">Filters</h2>
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-auto text-xs">
                Active
              </Badge>
            )}
          </div>
          <FilterSidebarContent />
        </div>
      </aside>

      {/* --- Mobile Filter Button + Sheet --- */}
      <div className="lg:hidden">
        <div className="flex items-center gap-2 mb-4">
          <Sheet
            open={mobileFiltersOpen}
            onOpenChange={setMobileFiltersOpen}
          >
            <SheetTrigger asChild>
              <Button variant="outline" className="min-h-[44px] min-w-[44px]">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Active
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[320px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>
                  Narrow down products by applying filters
                </SheetDescription>
              </SheetHeader>
              <div className="mt-2">
                <FilterSidebarContent />
              </div>
            </SheetContent>
          </Sheet>
          {/* Mobile Sort */}
          <Select
            value={sort}
            onValueChange={(val) => {
              setSort(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="min-h-[44px] flex-1">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <main className="flex-1 min-w-0">
        {/* Desktop sort */}
        <div className="hidden lg:flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Loading products..."
              : pagination.total > 0
                ? `Showing ${showingFrom}–${showingTo} of ${pagination.total} products`
                : "No products found"}
          </p>
        </div>

        {/* Mobile result count */}
        <p className="text-sm text-muted-foreground mb-4 lg:hidden">
          {isLoading
            ? "Loading products..."
            : pagination.total > 0
              ? `${pagination.total} product${pagination.total !== 1 ? "s" : ""}`
              : "No products found"}
        </p>

        {/* Active filters chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {selectedCategory && (
              <Badge
                variant="secondary"
                className="min-h-[28px] cursor-pointer"
                onClick={() => {
                  setSelectedCategory("");
                  setPage(1);
                }}
              >
                {categories.find((c) => c.slug === selectedCategory)?.name ||
                  selectedCategory}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            )}
            {selectedTags.map((tagId) => {
              const tag = tags.find((t) => t.id === tagId);
              return tag ? (
                <Badge
                  key={tagId}
                  variant="secondary"
                  className="min-h-[28px] cursor-pointer"
                  onClick={() => toggleTag(tagId)}
                >
                  {tag.name}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ) : null;
            })}
            {minPrice && (
              <Badge
                variant="secondary"
                className="min-h-[28px] cursor-pointer"
                onClick={() => {
                  setMinPrice("");
                  setPage(1);
                }}
              >
                Min: ₹{parseInt(minPrice).toLocaleString("en-IN")}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            )}
            {maxPrice && (
              <Badge
                variant="secondary"
                className="min-h-[28px] cursor-pointer"
                onClick={() => {
                  setMaxPrice("");
                  setPage(1);
                }}
              >
                Max: ₹{parseInt(maxPrice).toLocaleString("en-IN")}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            )}
            {inStockOnly && (
              <Badge
                variant="secondary"
                className="min-h-[28px] cursor-pointer"
                onClick={() => {
                  setInStockOnly(false);
                  setPage(1);
                }}
              >
                In Stock Only
                <X className="h-3 w-3 ml-1" />
              </Badge>
            )}
            {search && (
              <Badge
                variant="secondary"
                className="min-h-[28px] cursor-pointer"
                onClick={() => {
                  setSearch("");
                  setSearchInput("");
                  setPage(1);
                }}
              >
                Search: &ldquo;{search}&rdquo;
                <X className="h-3 w-3 ml-1" />
              </Badge>
            )}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 min-h-[44px]"
              onClick={fetchProducts}
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !error && <SkeletonGrid />}

        {/* Empty State */}
        {!isLoading && !error && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-6 mb-4">
              <Package className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-medium">No products found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {hasActiveFilters
                ? "Try adjusting your filters or search terms to find what you're looking for."
                : "There are no products available at the moment."}
            </p>
            {hasActiveFilters && (
              <Button
                className="mt-4 min-h-[44px]"
                onClick={clearAllFilters}
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        )}

        {/* Product Grid */}
        {!isLoading && !error && products.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {products.map((product) => (
                <Card
                  key={product.id}
                  className="group cursor-pointer overflow-hidden border hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
                  onClick={() =>
                    onNavigate("product", { slug: product.slug })
                  }
                >
                  <CardContent className="p-0">
                    {/* Image */}
                    <div className="relative aspect-square bg-muted overflow-hidden">
                      {product.primaryImage ? (
                        <Image
                          src={product.primaryImage}
                          alt={product.name}
                          width={400}
                          height={400}
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted">
                          <Package className="h-10 w-10 text-muted-foreground/40" />
                        </div>
                      )}
                      {/* Out of Stock badge */}
                      {!product.inStock && (
                        <div className="absolute top-2 left-2">
                          <Badge variant="destructive" className="text-xs">
                            Out of Stock
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3 space-y-1.5">
                      {/* Category */}
                      {product.category && (
                        <p className="text-xs text-muted-foreground truncate">
                          {product.category.name}
                        </p>
                      )}

                      {/* Name */}
                      <h3 className="text-sm font-medium leading-tight line-clamp-2 min-h-[2.5rem]">
                        {product.name}
                      </h3>

                      {/* Price */}
                      <p className="text-sm font-semibold">
                        ₹{product.price.toLocaleString("en-IN")}
                      </p>

                      {/* Rating */}
                      <StarRating
                        rating={product.averageRating}
                        count={product.reviewCount}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
                <p className="text-sm text-muted-foreground order-2 sm:order-1">
                  Showing {showingFrom}&ndash;{showingTo} of{" "}
                  {pagination.total.toLocaleString("en-IN")} products
                </p>
                <div className="flex items-center gap-1 order-1 sm:order-2">
                  {/* Previous */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="min-h-[44px] min-w-[44px]"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Previous</span>
                  </Button>

                  {/* Page Numbers */}
                  {getVisiblePageNumbers().map((pageNum) => (
                    <Button
                      key={pageNum}
                      variant={pageNum === pagination.page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="min-h-[44px] min-w-[44px]"
                    >
                      {pageNum}
                    </Button>
                  ))}

                  {/* Next */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="min-h-[44px] min-w-[44px]"
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Next</span>
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* --- Custom Scrollbar Styles --- */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: var(--border);
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: var(--muted-foreground);
        }
      `}</style>
    </div>
  );
}
