"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  SlidersHorizontal,
  X,
  Package,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import Image from "next/image";
import { StarRating, SkeletonGrid, FilterSidebarContent } from "./product-listing-helpers";

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

  // --- Clear tags handler ---
  const handleClearTags = () => {
    setSelectedTags([]);
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

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
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
          <FilterSidebarContent
            searchInput={searchInput}
            onSearchInputChange={setSearchInput}
            isFiltersLoading={isFiltersLoading}
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={(slug) => {
              setSelectedCategory(slug);
              setPage(1);
            }}
            tags={tags}
            selectedTags={selectedTags}
            onTagToggle={toggleTag}
            minPrice={minPrice}
            onMinPriceChange={handleMinPriceChange}
            maxPrice={maxPrice}
            onMaxPriceChange={handleMaxPriceChange}
            inStockOnly={inStockOnly}
            onInStockOnlyChange={(checked) => {
              setInStockOnly(checked);
              setPage(1);
            }}
            sort={sort}
            onSortChange={(val) => {
              setSort(val);
              setPage(1);
            }}
            hasActiveFilters={hasActiveFilters}
            onClearAllFilters={clearAllFilters}
            sortOptions={SORT_OPTIONS}
          />
        </div>
      </aside>

      {/* --- Mobile Filter Button + Sheet --- */}
      <div className="lg:hidden">
        <div className="flex items-center gap-2 mb-3">
          <Sheet
            open={mobileFiltersOpen}
            onOpenChange={setMobileFiltersOpen}
          >
            <SheetTrigger asChild>
              <Button variant="outline" className="min-h-[44px] min-w-[44px]">
                <Filter className="h-4 w-4" />
                <span className="ml-2">Filters</span>
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Active
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85%] sm:w-[320px] overflow-y-auto p-4">
              <SheetHeader className="text-left">
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>
                  Narrow down products by applying filters
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4">
                <FilterSidebarContent
                  searchInput={searchInput}
                  onSearchInputChange={setSearchInput}
                  isFiltersLoading={isFiltersLoading}
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onCategoryChange={(slug) => {
                    setSelectedCategory(slug);
                    setPage(1);
                  }}
                  tags={tags}
                  selectedTags={selectedTags}
                  onTagToggle={toggleTag}
                  minPrice={minPrice}
                  onMinPriceChange={handleMinPriceChange}
                  maxPrice={maxPrice}
                  onMaxPriceChange={handleMaxPriceChange}
                  inStockOnly={inStockOnly}
                  onInStockOnlyChange={(checked) => {
                    setInStockOnly(checked);
                    setPage(1);
                  }}
                  sort={sort}
                  onSortChange={(val) => {
                    setSort(val);
                    setPage(1);
                  }}
                  hasActiveFilters={hasActiveFilters}
                  onClearAllFilters={clearAllFilters}
                  sortOptions={SORT_OPTIONS}
                />
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
        <div className="hidden lg:flex items-center justify-between mb-5">
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Loading products..."
              : pagination.total > 0
                ? `Showing ${showingFrom}–${showingTo} of ${pagination.total} products`
                : "No products found"}
          </p>
        </div>

        {/* Mobile result count */}
        <p className="text-sm text-muted-foreground mb-3 lg:hidden">
          {isLoading
            ? "Loading products..."
            : pagination.total > 0
              ? `${pagination.total} product${pagination.total !== 1 ? "s" : ""}`
              : "No products found"}
        </p>

        {/* Active filters chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {selectedCategory && (
              <Badge
                variant="secondary"
                className="min-h-[28px] cursor-pointer text-xs"
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
                  className="min-h-[28px] cursor-pointer text-xs"
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
                className="min-h-[28px] cursor-pointer text-xs"
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
                className="min-h-[28px] cursor-pointer text-xs"
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
                className="min-h-[28px] cursor-pointer text-xs"
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
                className="min-h-[28px] cursor-pointer text-xs"
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
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-5 mb-3">
              <Package className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-base font-medium">No products found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm px-4">
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
            <div className="grid grid-cols-2 gap-2 xs:gap-2.5 sm:grid-cols-2 sm:gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 lg:gap-6">
              {products.map((product) => (
                <Card
                  key={product.id}
                  className="group cursor-pointer overflow-hidden border hover:shadow-md transition-all duration-200 active:scale-[0.98] lg:hover:scale-[1.02]"
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
                          <Package className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                      )}
                      {/* Out of Stock badge */}
                      {!product.inStock && (
                        <div className="absolute top-1.5 left-1.5">
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5">
                            Out of Stock
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-2.5 xs:p-3 space-y-1">
                      {/* Category */}
                      {product.category && (
                        <p className="text-[10px] xs:text-xs text-muted-foreground truncate">
                          {product.category.name}
                        </p>
                      )}

                      {/* Name */}
                      <h3 className="text-xs xs:text-sm font-medium leading-tight line-clamp-2 min-h-[2.4rem] xs:min-h-10">
                        {product.name}
                      </h3>

                      {/* Price */}
                      <p className="text-xs xs:text-sm font-semibold">
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
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                <p className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
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
                    className="min-h-[40px] min-w-[40px]"
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
                      className="min-h-[40px] min-w-[40px] text-sm"
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
                    className="min-h-[40px] min-w-[40px]"
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