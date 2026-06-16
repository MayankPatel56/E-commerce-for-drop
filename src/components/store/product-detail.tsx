"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Star,
  ShoppingCart,
  ArrowLeft,
  Package,
  Check,
  Loader2,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ProductReview {
  id: number;
  rating: number;
  title: string;
  comment: string;
  reviewedAt: string;
  customerName: string;
}

interface ProductVariantOption {
  value: string;
  variantId: number;
  price: number | null;
  stockQuantity: number;
  isOutOfStock: boolean;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  primaryImage: string | null;
  galleryImages: string[];
  seoTitle: string;
  seoDescription: string;
  category: { id: number; name: string; slug: string } | null;
  variants: {
    id: number;
    sku: string;
    variantType: string;
    variantValue: string;
    price: number | null;
    stockQuantity: number;
    isOutOfStock: boolean;
  }[];
  variantTypes: Record<string, ProductVariantOption[]>;
  tags: { id: number; name: string }[];
  reviews: ProductReview[];
  averageRating: number;
  reviewCount: number;
}

interface ProductDetailProps {
  slug: string;
  onNavigate: (view: string, data?: Record<string, unknown>) => void;
}

// ─── Helper ─────────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────

function ProductDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6">
      {/* Back link */}
      <Skeleton className="h-5 w-32" />

      <div className="grid gap-8 md:grid-cols-2">
        {/* Left column — image skeleton */}
        <div className="space-y-3">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="h-16 w-16 rounded-md" />
            <Skeleton className="h-16 w-16 rounded-md" />
            <Skeleton className="h-16 w-16 rounded-md" />
            <Skeleton className="h-16 w-16 rounded-md" />
          </div>
        </div>

        {/* Right column — info skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-4 w-48" /> {/* breadcrumb */}
          <Skeleton className="h-8 w-3/4" /> {/* title */}
          <Skeleton className="h-5 w-32" /> {/* rating */}
          <Skeleton className="h-8 w-24" /> {/* price */}
          <Skeleton className="h-20 w-full" /> {/* description */}
          <Skeleton className="h-10 w-full" /> {/* variant row */}
          <Skeleton className="h-10 w-full" /> {/* variant row */}
          <Skeleton className="h-12 w-full" /> {/* add to cart */}
          <Skeleton className="h-4 w-40" /> {/* category link */}
        </div>
      </div>

      {/* Reviews skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}

// ─── Star Rating Display ───────────────────────────────────────────────────

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const iconClass = size === "md" ? "size-5" : "size-4";
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(rating);
        return (
          <Star
            key={star}
            className={`${iconClass} ${
              filled
                ? "fill-yellow-400 text-yellow-400"
                : "fill-muted text-muted"
            }`}
          />
        );
      })}
    </div>
  );
}

// ─── Not Found ────────────────────────────────────────────────────────────

function ProductNotFound({ onNavigate }: { onNavigate: (view: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <Package className="size-16 text-muted-foreground" />
      <h2 className="text-2xl font-bold">Product not found</h2>
      <p className="text-muted-foreground">
        The product you are looking for does not exist or has been removed.
      </p>
      <Button
        variant="default"
        onClick={() => onNavigate("shop")}
        className="min-h-[48px] px-8"
      >
        <ArrowLeft className="size-4" />
        Back to Shop
      </Button>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function ProductDetail({ slug, onNavigate }: ProductDetailProps) {
  // ── State ──
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [mainImage, setMainImage] = useState<string>("");
  const [selectedVariants, setSelectedVariants] = useState<
    Record<
      string,
      {
        value: string;
        variantId: number;
        price: number | null;
        stockQuantity: number;
        isOutOfStock: boolean;
      }
    >
  >({});
  const [isAddingToCart, setIsAddingToCart] = useState<boolean>(false);

  const { addItem } = useCart();

  // ── Fetch product ──
  useEffect(() => {
    let cancelled = false;

    async function fetchProduct() {
      setLoading(true);
      setError(false);
      setNotFound(false);

      try {
        const res = await fetch(`/api/products/${slug}`);
        if (res.status === 404) {
          if (!cancelled) {
            setNotFound(true);
            setLoading(false);
          }
          return;
        }
        if (!res.ok) {
          throw new Error(`Failed to fetch product: ${res.status}`);
        }

        const data: Product = await res.json();
        if (!cancelled) {
          setProduct(data);
          setMainImage(data.primaryImage || "");
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    fetchProduct();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Reset selected variants when product changes
  useEffect(() => {
    setSelectedVariants({});
    if (product) {
      setMainImage(product.primaryImage || "");
    }
  }, [product?.id]);

  // ── Image list for gallery ──
  const allImages: string[] = product
    ? [product.primaryImage, ...product.galleryImages].filter(Boolean) as string[]
    : [];

  // ── Variant selection logic ──
  const variantTypeKeys = product
    ? Object.keys(product.variantTypes)
    : [];

  const allVariantTypesSelected =
    variantTypeKeys.length > 0 &&
    variantTypeKeys.every((key) => selectedVariants[key] !== undefined);

  // Find the variant that matches the fully selected combination
  const currentVariant = (() => {
    if (!product || !allVariantTypesSelected) return null;

    // The selected variantId is from the LAST selected variant type.
    // For a fully selected combination, we look up the variant from product.variants
    // that matches all selected values.
    const selectedValues = variantTypeKeys.map(
      (key) => selectedVariants[key]?.value
    );

    const match = product.variants.find((v) => {
      return variantTypeKeys.every((key, idx) => v.variantType === key && v.variantValue === selectedValues[idx]);
    });

    return match || null;
  })();

  const isCurrentVariantOutOfStock =
    currentVariant?.isOutOfStock ?? false;

  const isVariantDisabled =
    !allVariantTypesSelected || isCurrentVariantOutOfStock;

  const noVariantsAvailable = product && product.variants.length === 0;

  // ── Handlers ──
  const handleVariantSelect = useCallback(
    (type: string, option: ProductVariantOption) => {
      if (option.isOutOfStock) return;

      setSelectedVariants((prev) => ({
        ...prev,
        [type]: {
          value: option.value,
          variantId: option.variantId,
          price: option.price,
          stockQuantity: option.stockQuantity,
          isOutOfStock: option.isOutOfStock,
        },
      }));
    },
    []
  );

  const handleAddToCart = useCallback(async () => {
    if (!product || !currentVariant || isCurrentVariantOutOfStock) return;

    setIsAddingToCart(true);

    // Build variant description
    const variantParts = variantTypeKeys.map(
      (key) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${selectedVariants[key].value}`
    );
    const variantDescription = variantParts.join(", ");

    try {
      addItem({
        variantId: currentVariant.id,
        productId: product.id,
        productName: product.name,
        variantDescription,
        price: currentVariant.price ?? product.price,
        quantity: 1,
        imageUrl: product.primaryImage || "",
        stockAvailable: currentVariant.stockQuantity,
      });
    } catch {
      // Cart add failed — silently handle
    } finally {
      // Brief delay to show loading feedback
      setTimeout(() => setIsAddingToCart(false), 400);
    }
  }, [product, currentVariant, selectedVariants, variantTypeKeys, isCurrentVariantOutOfStock, addItem]);

  // ── Render states ──
  if (loading) return <ProductDetailSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-20 text-center">
        <p className="text-lg text-destructive">Something went wrong loading this product.</p>
        <Button
          variant="outline"
          onClick={() => onNavigate("shop")}
          className="min-h-[48px] px-8"
        >
          <ArrowLeft className="size-4" />
          Back to Shop
        </Button>
      </div>
    );
  }

  if (notFound) {
    return <ProductNotFound onNavigate={onNavigate} />;
  }

  if (!product) return null;

  // ── Determine price display ──
  const displayPrice = currentVariant?.price ?? product.price;
  const hasPriceOverride = currentVariant?.price != null;

  // ── Render ──
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      {/* Back navigation */}
      <button
        type="button"
        onClick={() => onNavigate("shop")}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
      >
        <ArrowLeft className="size-4" />
        Back to Shop
      </button>

      {/* Two-column layout */}
      <div className="grid gap-6 md:gap-10 md:grid-cols-2">
        {/* ── Left Column: Image Gallery ── */}
        <div className="space-y-3">
          {/* Main image */}
          <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-muted">
            {mainImage ? (
              <img
                src={mainImage}
                alt={product.name}
                className="size-full object-cover transition-opacity"
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <Package className="size-16 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Thumbnail row */}
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setMainImage(img)}
                  className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2 transition-all min-h-[44px] min-w-[44px] ${
                    mainImage === img
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-transparent hover:border-muted-foreground/30"
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} image ${idx + 1}`}
                    className="size-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Right Column: Product Info ── */}
        <div className="space-y-4">
          {/* Breadcrumb */}
          {product.category && (
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate("shop");
                    }}
                  >
                    Home
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate("shop", { category: product.category!.slug });
                    }}
                  >
                    {product.category.name}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{product.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          )}

          {/* Product Name */}
          <h1 className="text-2xl font-bold leading-tight md:text-3xl">
            {product.name}
          </h1>

          {/* Rating */}
          {product.reviewCount > 0 && (
            <div className="flex items-center gap-2">
              <StarRating rating={product.averageRating} />
              <span className="text-sm text-muted-foreground">
                {product.averageRating} ({product.reviewCount}{" "}
                {product.reviewCount === 1 ? "review" : "reviews"})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-2">
            {hasPriceOverride ? (
              <>
                <span className="text-2xl font-bold">
                  {formatPrice(displayPrice)}
                </span>
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(product.price)}
                </span>
              </>
            ) : (
              <span className="text-2xl font-bold">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-muted-foreground whitespace-pre-line text-sm leading-relaxed">
              {product.description}
            </p>
          )}

          <Separator />

          {/* Variant Selector */}
          {variantTypeKeys.map((type) => {
            const options = product.variantTypes[type];
            if (!options || options.length === 0) return null;
            const selected = selectedVariants[type];

            return (
              <div key={type} className="space-y-2">
                <label className="text-sm font-medium">
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </label>
                <div className="flex flex-wrap gap-2">
                  {options.map((option) => {
                    const isSelected = selected?.variantId === option.variantId;
                    const isOOS = option.isOutOfStock;

                    return (
                      <button
                        key={option.variantId}
                        type="button"
                        disabled={isOOS}
                        onClick={() => handleVariantSelect(type, option)}
                        className={`relative min-h-[44px] rounded-md border px-4 py-2 text-sm font-medium transition-all ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : isOOS
                              ? "cursor-not-allowed border-border opacity-50"
                              : "border-border hover:border-primary/50 hover:bg-accent"
                        }`}
                      >
                        {option.value}
                        {isOOS && (
                          <span className="ml-1.5 text-xs">(Out of Stock)</span>
                        )}
                        {isSelected && (
                          <Check className="ml-1.5 inline size-3.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {product.tags.map((tag) => (
                <Badge key={tag.id} variant="secondary" className="text-xs">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Add to Cart */}
          <div className="pt-2">
            {noVariantsAvailable ? (
              <Button
                disabled
                className="w-full min-h-[48px] text-base font-semibold"
              >
                <ShoppingCart className="size-5" />
                No variants available
              </Button>
            ) : isCurrentVariantOutOfStock && allVariantTypesSelected ? (
              <Button
                disabled
                className="w-full min-h-[48px] text-base font-semibold"
              >
                <ShoppingCart className="size-5" />
                Out of Stock
              </Button>
            ) : (
              <Button
                disabled={isVariantDisabled || isAddingToCart}
                onClick={handleAddToCart}
                className="w-full min-h-[48px] text-base font-semibold"
              >
                {isAddingToCart ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <ShoppingCart className="size-5" />
                )}
                {isAddingToCart
                  ? "Adding..."
                  : !allVariantTypesSelected
                    ? "Select Options"
                    : "Add to Cart"}
              </Button>
            )}
          </div>

          {/* Category link */}
          {product.category && (
            <button
              type="button"
              onClick={() =>
                onNavigate("shop", { category: product.category!.slug })
              }
              className="inline-block text-sm font-medium text-primary hover:underline min-h-[44px]"
            >
              View all in {product.category.name}
            </button>
          )}
        </div>
      </div>

      {/* ── Reviews Section ── */}
      <Separator className="my-8 md:my-10" />

      <section className="space-y-6">
        <h2 className="text-xl font-bold">
          Customer Reviews ({product.reviewCount})
        </h2>

        {product.reviews.length > 0 ? (
          <div className="space-y-4">
            {product.reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-lg border bg-card p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-bold">
                      {getInitials(review.customerName)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {review.customerName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(review.reviewedAt)}
                      </p>
                    </div>
                  </div>
                  <StarRating rating={review.rating} size="sm" />
                </div>

                {review.title && (
                  <p className="text-sm font-semibold">{review.title}</p>
                )}
                {review.comment && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {review.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-8 text-center">
            No reviews yet. Be the first to review this product!
          </p>
        )}
      </section>
    </div>
  );
}
