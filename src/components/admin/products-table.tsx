"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Package,
  RefreshCw,
} from "lucide-react";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  primaryImage: string | null;
  galleryImages: string;
  seoTitle: string | null;
  seoDescription: string | null;
  isPublished: boolean;
  categoryId: number;
  createdAt: string;
  category: { id: number; name: string; slug: string };
  variantCount: number;
  tagNames: string[];
}

interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

interface ProductsTableProps {
  onEdit: (id: number) => void;
  onCreate: () => void;
  onRefresh: () => void;
}

export function ProductsTable({ onEdit, onCreate, onRefresh }: ProductsTableProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState("newest");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/admin/categories");
        if (!res.ok) throw new Error("Failed to fetch categories");
        const data = await res.json();
        setCategories(data.categories || []);
      } catch {
        // Silent fail for categories — non-critical
      }
    };
    fetchCategories();
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter && categoryFilter !== "all") params.set("category", categoryFilter);
      if (inStockOnly) params.set("inStock", "true");
      params.set("sort", sort);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const res = await fetch(`/api/admin/products?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch products");

      const data: ProductsResponse = await res.json();
      setProducts(data.products || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [search, categoryFilter, inStockOnly, sort, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok || data.error) {
        toast.error(data.error || "Failed to delete product");
        return;
      }

      toast.success(data.message || "Product deleted successfully");
      fetchProducts();
      onRefresh();
    } catch {
      toast.error("Failed to delete product");
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  // Check if any variant has stock
  const hasStock = (product: Product): boolean => {
    return (product.variantCount ?? 0) > 0;
  };

  // Skeleton for loading
  const TableSkeleton = () => (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 p-3 border-b">
          <Skeleton className="h-5 w-full sm:w-[140px]" />
          <Skeleton className="h-5 w-full sm:w-[80px]" />
          <Skeleton className="h-5 w-full sm:w-[60px]" />
          <Skeleton className="h-5 w-full sm:w-[40px]" />
          <Skeleton className="h-5 w-full sm:w-[70px]" />
          <Skeleton className="h-5 w-full sm:w-[60px]" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Products</h2>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading..." : `${total} product${total !== 1 ? "s" : ""} found`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchProducts();
              onRefresh();
            }}
            className="min-h-[44px] min-w-[44px]"
          >
            <RefreshCw className="h-4 w-4 mr-2 sm:mr-2" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button onClick={onCreate} className="min-h-[44px] min-w-[44px]">
            <Plus className="h-4 w-4 mr-2 sm:mr-2" />
            <span className="hidden sm:inline">Add Product</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 min-h-[44px] w-full"
          />
        </form>

        {/* Category Filter */}
        <Select value={categoryFilter} onValueChange={(val) => { setCategoryFilter(val); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[180px] min-h-[44px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={String(cat.id)}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sort} onValueChange={(val) => { setSort(val); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[180px] min-h-[44px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="price_asc">Price: Low to High</SelectItem>
            <SelectItem value="price_desc">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>

        {/* In Stock Toggle */}
        <div className="flex items-center gap-2 px-3 min-h-[44px] border rounded-md bg-background">
          <Switch
            id="in-stock-toggle"
            checked={inStockOnly}
            onCheckedChange={(checked) => { setInStockOnly(checked); setPage(1); }}
          />
          <Label htmlFor="in-stock-toggle" className="text-sm cursor-pointer whitespace-nowrap">
            In Stock Only
          </Label>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && <TableSkeleton />}

      {/* Empty State */}
      {!isLoading && !error && products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
          <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">No products found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            {search || categoryFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Get started by adding your first product"}
          </p>
          {!search && categoryFilter === "all" && (
            <Button onClick={onCreate} className="mt-4 min-h-[44px] w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          )}
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && products.length > 0 && (
        <>
          <div className="max-h-[50vh] sm:max-h-none overflow-auto rounded-md border">
            <div className="min-w-[640px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[160px]">Name</TableHead>
                    <TableHead className="min-w-[100px]">Category</TableHead>
                    <TableHead className="min-w-[80px]">Price</TableHead>
                    <TableHead className="min-w-[60px] text-center">Variants</TableHead>
                    <TableHead className="min-w-[90px]">Stock</TableHead>
                    <TableHead className="min-w-[90px]">Status</TableHead>
                    <TableHead className="min-w-[44px]">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="min-w-[250px]">
                        <div className="flex items-center gap-3">
                          {product.primaryImage ? (
                            <div className="h-9 w-9 rounded-md overflow-hidden bg-muted shrink-0">
                              <Image
                                src={product.primaryImage}
                                alt={product.name}
                                width={36}
                                height={36}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <span className="font-medium block max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">{product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {product.category?.name || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">
                          ₹{product.price.toLocaleString("en-IN")}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm text-muted-foreground">
                          {product. variantCount ?? 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={hasStock(product) ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {hasStock(product) ? "In Stock" : "Out of Stock"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.isPublished ? "default" : "secondary"} className="text-xs">
                          {product.isPublished ? "Published" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="min-h-[44px] min-w-[44px] p-2"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => onEdit(product.id)}
                              className="min-h-[44px] cursor-pointer"
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(product.id)}
                              className="min-h-[44px] text-destructive focus:text-destructive cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground order-2 sm:order-1">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2 order-1 sm:order-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="min-h-[44px] min-w-[44px]"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only">Previous</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="min-h-[44px] min-w-[44px]"
                >
                  <span className="sr-only sm:not-sr-only">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}