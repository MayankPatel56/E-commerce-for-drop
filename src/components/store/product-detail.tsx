"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  PenSquare,
  LogIn,
  X,
  Play,
  Truck,
  ShieldCheck,
  RotateCcw,
  Lock,
  Zap,
  Heart,
  Minus,
  Plus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import * as LucideIcons from "lucide-react";

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
  colorHex?: string | null;
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
  compareAtPrice: number | null;
  badgeText: string | null;
  soldLabel: string | null;
  videoUrl: string | null;
  features: { icon: string; label: string }[];
  bundleOffers: {
    quantity: number;
    label: string;
    price: number;
    compareAtPrice: number | null;
    badge: string | null;
  }[];
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
    colorHex?: string | null;
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
  isAuthenticated?: boolean;
}

const TRUST_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  RotateCcw,
  Truck,
  ShieldCheck,
  Lock,
};

// ─── Helper Functions ──────────────────────────────────────────────────────

function getFeatureIcon(name: string): React.ComponentType<{ className?: string }> {
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name];
  return Icon || Zap;
}

interface TrustBadge {
  icon: string;
  title: string;
  subtitle: string;
}

const DEFAULT_TRUST_BADGES: TrustBadge[] = [
  { icon: "RotateCcw", title: "7 Days", subtitle: "Easy Returns" },
  { icon: "Truck", title: "Free", subtitle: "Shipping" },
  { icon: "ShieldCheck", title: "1 Year", subtitle: "Warranty" },
  { icon: "Lock", title: "Secure", subtitle: "Payment" },
];

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
    <div className="mx-auto w-full max-w-6xl space-y-4 sm:space-y-6 px-3 sm:px-4 py-4 sm:py-6">
      <Skeleton className="h-5 w-28 sm:w-32" />
      <div className="grid gap-4 sm:gap-6 md:gap-8 sm:grid-cols-1 md:grid-cols-2">
        <div className="space-y-3">
          <Skeleton className="aspect-square w-full rounded-xl sm:rounded-2xl" />
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Skeleton className="h-14 w-14 sm:h-16 sm:w-16 rounded-lg sm:rounded-xl shrink-0" />
            <Skeleton className="h-14 w-14 sm:h-16 sm:w-16 rounded-lg sm:rounded-xl shrink-0" />
            <Skeleton className="h-14 w-14 sm:h-16 sm:w-16 rounded-lg sm:rounded-xl shrink-0" />
            <Skeleton className="h-14 w-14 sm:h-16 sm:w-16 rounded-lg sm:rounded-xl shrink-0" />
          </div>
        </div>
        <div className="space-y-3 sm:space-y-4">
          <Skeleton className="h-3 w-32 sm:h-4 sm:w-48" />
          <Skeleton className="h-6 w-3/4 sm:h-8" />
          <Skeleton className="h-4 w-24 sm:h-5 sm:w-32" />
          <Skeleton className="h-7 w-20 sm:h-8 sm:w-24" />
          <Skeleton className="h-16 w-full sm:h-20" />
          <Skeleton className="h-10 w-full sm:h-11" />
          <Skeleton className="h-10 w-full sm:h-11" />
          <Skeleton className="h-11 w-full sm:h-12" />
          <Skeleton className="h-3 w-32 sm:h-4 sm:w-40" />
        </div>
      </div>
      <div className="space-y-3 sm:space-y-4">
        <Skeleton className="h-6 w-40 sm:h-7 sm:w-48" />
        <Skeleton className="h-20 w-full sm:h-24" />
        <Skeleton className="h-20 w-full sm:h-24" />
      </div>
    </div>
  );
}

// ─── Star Rating Display ───────────────────────────────────────────────────

function StarRating({ rating, size = "sm", showLabel = false }: { rating: number; size?: "sm" | "md" | "lg"; showLabel?: boolean }) {
  const sizeMap = { sm: "size-3 sm:size-3.5", md: "size-4 sm:size-5", lg: "size-5 sm:size-6" };
  const iconClass = sizeMap[size] || sizeMap.sm;
  
  return (
    <div className="flex items-center gap-1 sm:gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= Math.round(rating);
          return (
            <Star
              key={star}
              className={`${iconClass} ${
                filled
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-muted/30 text-muted/30"
              } transition-colors`}
            />
          );
        })}
      </div>
      {showLabel && (
        <span className="text-xs sm:text-sm font-medium text-foreground">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}

// ─── Not Found ────────────────────────────────────────────────────────────

function ProductNotFound({ onNavigate }: { onNavigate: (view: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-4 sm:gap-6 px-4 py-16 sm:py-20 text-center"
    >
      <div className="rounded-full bg-muted p-4 sm:p-6">
        <Package className="size-12 sm:size-16 text-muted-foreground" />
      </div>
      <h2 className="text-xl sm:text-2xl font-bold">Product not found</h2>
      <p className="text-sm sm:text-base text-muted-foreground max-w-md px-2">
        The product you are looking for does not exist or has been removed.
      </p>
      <Button
        variant="default"
        onClick={() => onNavigate("shop")}
        className="min-h-[44px] sm:min-h-12 px-6 sm:px-8 rounded-full"
      >
        <ArrowLeft className="size-4 mr-2" />
        Back to Shop
      </Button>
    </motion.div>
  );
}

// ─── Review Form ────────────────────────────────────────────────────────────

function ReviewForm({ productId, onSubmitted }: { productId: number; onSubmitted: () => void }) {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [eligibilityChecked, setEligibilityChecked] = useState(false);
  const [eligible, setEligible] = useState(false);
  const [ineligibleReason, setIneligibleReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch("/api/reviews/check-eligibility", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        const data = await res.json();
        setEligibilityChecked(true);
        if (data.eligible) {
          setEligible(true);
        } else {
          setEligible(false);
          setIneligibleReason(data.reason || "You cannot review this product");
        }
      } catch {
        setIneligibleReason("Failed to check eligibility");
        setEligibilityChecked(true);
      }
    }
    check();
  }, [productId]);

  const handleSubmit = async () => {
    if (rating === 0) { setFormError("Please select a rating"); return; }
    if (!comment.trim()) { setFormError("Please write a comment"); return; }
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rating,
          title: title.trim() || undefined,
          comment: comment.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to submit review");
        return;
      }
      setSuccess(true);
      setTimeout(() => onSubmitted(), 2000);
    } catch {
      setFormError("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (!eligibilityChecked) {
    return (
      <div className="rounded-xl sm:rounded-2xl border p-6 sm:p-8 flex items-center justify-center">
        <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!eligible) {
    return (
      <Alert variant="destructive" className="mb-4 relative rounded-lg sm:rounded-xl">
        <AlertDescription className="pr-8 text-sm sm:text-base">{ineligibleReason}</AlertDescription>
        <button
          onClick={onSubmitted}
          className="absolute right-2 top-2 p-1.5 rounded-full hover:bg-destructive/10 transition-colors min-h-[36px] min-w-[36px]"
          aria-label="Dismiss notice"
        >
          <X className="h-4 w-4" />
        </button>
      </Alert>
    );
  }

  if (success) {
    return (
      <Alert className="mb-4 border-green-200 bg-green-50 rounded-lg sm:rounded-xl">
        <AlertDescription className="text-green-700 text-sm sm:text-base">
          ✅ Review submitted successfully! It will appear after admin approval.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl sm:rounded-2xl border bg-card/50 backdrop-blur-sm p-4 sm:p-6 space-y-4 sm:space-y-5 mb-4"
    >
      <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
        <PenSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        Write Your Review
      </h3>

      {formError && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 sm:px-4 py-2 rounded-lg">
          {formError}
        </p>
      )}

      <div className="space-y-2">
        <Label className="text-sm font-medium">Rating</Label>
        <div className="flex items-center gap-0.5 sm:gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="p-1.5 min-h-[40px] min-w-[40px] sm:min-h-11 sm:min-w-11 flex items-center justify-center rounded-full hover:bg-yellow-50 transition-all"
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              onClick={() => setRating(star)}
              aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
            >
              <Star
                size={24}
                className={`transition-all sm:size-7 ${
                  star <= (hoveredStar || rating)
                    ? "fill-yellow-400 text-yellow-400 scale-110"
                    : "fill-muted/30 text-muted/30"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-title" className="text-sm font-medium">Title (optional)</Label>
        <Input
          id="review-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          maxLength={100}
          className="rounded-lg sm:rounded-xl min-h-[40px] sm:min-h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-comment" className="text-sm font-medium">Comment</Label>
        <Textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell us about your experience with this product..."
          rows={4}
          maxLength={1000}
          className="rounded-lg sm:rounded-xl"
        />
        <p className="text-xs text-muted-foreground text-right">
          {comment.length}/1000
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-2">
        <Button 
          onClick={handleSubmit} 
          disabled={submitting} 
          className="min-h-[44px] sm:min-h-12 px-6 sm:px-8 rounded-full w-full sm:w-auto"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {submitting ? "Submitting..." : "Submit Review"}
        </Button>
        <Button variant="ghost" onClick={onSubmitted} className="min-h-[44px] sm:min-h-12 rounded-full w-full sm:w-auto">
          Cancel
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function ProductDetail({ slug, onNavigate, isAuthenticated }: ProductDetailProps) {
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
  const [showReviewForm, setShowReviewForm] = useState<boolean>(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedBundleIndex, setSelectedBundleIndex] = useState<number>(0);
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [trustBadges, setTrustBadges] = useState<TrustBadge[]>(DEFAULT_TRUST_BADGES);
  const [showVideo, setShowVideo] = useState<boolean>(false);

  const { addItem } = useCart();

  // ── Fetch global trust badges (same across all products) ──
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.trust_badges) && data.trust_badges.length > 0) {
          setTrustBadges(data.trust_badges);
        }
      })
      .catch(() => {
        // keep defaults on failure
      });
  }, []);

  // ── Fetch product with immediate state reset ──
  useEffect(() => {
    let cancelled = false;

    async function fetchProduct() {
      setLoading(true);
      setError(false);
      setNotFound(false);
      setSelectedVariants({});
      setMainImage("");
      setShowReviewForm(false);
      setQuantity(1);
      setSelectedBundleIndex(0);
      setImageLoaded(false);

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

  // ── Sync quantity with selected bundle tier ──
  useEffect(() => {
    if (product?.bundleOffers && product.bundleOffers.length > 0) {
      const tier = product.bundleOffers[selectedBundleIndex];
      if (tier) setQuantity(tier.quantity);
    }
  }, [product, selectedBundleIndex]);

  // // ── Variant matching ──
  const variantTypeKeys = product ? Object.keys(product.variantTypes) : [];

  const allVariantTypesSelected =
    variantTypeKeys.length > 0 &&
    variantTypeKeys.every((key) => selectedVariants[key] !== undefined);

  const selectedOptionIds = useMemo(
    () => Object.values(selectedVariants).map((v) => v.variantId),
    [selectedVariants]
  );

  const currentVariant = useMemo(() => {
    if (!product || !allVariantTypesSelected) return null;
    const matched = product.variants.find((v) =>
      selectedOptionIds.includes(v.id)
    );
    return matched || null;
  }, [product, allVariantTypesSelected, selectedOptionIds]);

  const isCurrentVariantOutOfStock = currentVariant?.isOutOfStock ?? false;
  const isVariantDisabled = !allVariantTypesSelected || isCurrentVariantOutOfStock;
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

    const variantParts = variantTypeKeys.map(
      (key) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${selectedVariants[key].value}`
    );
    const variantDescription = variantParts.join(", ");

    const selectedBundle = product.bundleOffers?.[selectedBundleIndex];
    const basePrice = currentVariant.price ?? product.price;
    const effectivePrice = selectedBundle
      ? selectedBundle.price / selectedBundle.quantity
      : basePrice;
    const effectiveDescription = selectedBundle
      ? [variantDescription, selectedBundle.label].filter(Boolean).join(" — ")
      : variantDescription;

    // Calculate bundle discount if applicable
    const bundleDiscount = selectedBundle
      ? (basePrice - effectivePrice) * quantity
      : 0;

    try {
      addItem({
        variantId: currentVariant.id,
        productId: product.id,
        productName: product.name,
        variantDescription: effectiveDescription,
        price: effectivePrice,
        quantity: quantity,
        imageUrl: product.primaryImage || "",
        stockAvailable: currentVariant.stockQuantity,
        // Bundle offer fields
        originalPrice: basePrice,
        bundleLabel: selectedBundle?.label,
        bundleDiscount: bundleDiscount,
        bundleQuantity: selectedBundle?.quantity,
      });
    } catch {
      // silently handle
    } finally {
      setTimeout(() => setIsAddingToCart(false), 400);
    }
  }, [product, currentVariant, selectedVariants, variantTypeKeys, isCurrentVariantOutOfStock, addItem, quantity, selectedBundleIndex]);

  // ── Render states ──
  if (loading) return <ProductDetailSkeleton />;
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-16 sm:py-20 text-center">
        <div className="rounded-full bg-destructive/10 p-3 sm:p-4">
          <Package className="size-10 sm:size-12 text-destructive" />
        </div>
        <p className="text-base sm:text-lg text-destructive">Something went wrong loading this product.</p>
        <Button
          variant="outline"
          onClick={() => onNavigate("shop")}
          className="min-h-[44px] sm:min-h-12 px-6 sm:px-8 rounded-full"
        >
          <ArrowLeft className="size-4 mr-2" />
          Back to Shop
        </Button>
      </div>
    );
  }
  if (notFound) return <ProductNotFound onNavigate={onNavigate} />;
  if (!product) return null;

  const displayPrice = currentVariant?.price ?? product.price;
  const hasPriceOverride = currentVariant?.price != null;
  const allImages: string[] = product
    ? [product.primaryImage, ...product.galleryImages].filter(Boolean) as string[]
    : [];

  const discountPercent = product.compareAtPrice 
    ? Math.round(((product.compareAtPrice - displayPrice) / product.compareAtPrice) * 100)
    : 0;

  const maxStock = currentVariant?.stockQuantity || 0;
  const bundleExceedsStock = Boolean(product.bundleOffers?.length) && quantity > maxStock;

  // ── Render ──
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto w-full max-w-6xl px-3 sm:px-4 py-4 sm:py-6"
    >
      {/* Back navigation */}
      <button
        type="button"
        onClick={() => onNavigate("shop")}
        className="group mb-4 sm:mb-6 inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-all min-h-[40px] sm:min-h-11"
      >
        <ArrowLeft className="size-3.5 sm:size-4 group-hover:-translate-x-1 transition-transform" />
        Back to Shop
      </button>

      <div className="grid gap-4 sm:gap-6 md:gap-8 lg:grid-cols-2 lg:gap-10">
        {/* ── Left Column: Image Gallery ── */}
        <div className="space-y-3 sm:space-y-4">
          {/* Main image */}
          <motion.div 
            className="relative aspect-square w-full overflow-hidden rounded-xl sm:rounded-2xl border bg-muted/30"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {mainImage ? (
              <>
                <Image
                  src={mainImage}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className={`object-cover transition-opacity duration-500 ${
                    imageLoaded ? "opacity-100" : "opacity-0"
                  }`}
                  priority
                  onLoad={() => setImageLoaded(true)}
                />
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground" />
                  </div>
                )}
              </>
            ) : (
              <div className="flex size-full items-center justify-center">
                <Package className="size-12 sm:size-16 text-muted-foreground" />
              </div>
            )}
            
            {/* Badge */}
            {product.badgeText && (
              <Badge className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-primary text-primary-foreground rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-sm font-semibold shadow-lg">
                {product.badgeText}
              </Badge>
            )}
            
            {discountPercent > 0 && (
              <Badge className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-red-500 text-white rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-sm font-semibold shadow-lg">
                {discountPercent}% OFF
              </Badge>
            )}

            {/* Video overlay */}
            {product.videoUrl && (
              <button
                type="button"
                onClick={() => setShowVideo(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors group"
              >
                <div className="rounded-full bg-white/90 p-3 sm:p-4 shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="size-6 sm:size-8 text-primary fill-primary" />
                </div>
              </button>
            )}
          </motion.div>

          {/* Video Modal */}
          {showVideo && product.videoUrl && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4"
              onClick={() => setShowVideo(false)}
            >
              <div className="relative w-full max-w-3xl aspect-video" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => setShowVideo(false)}
                  className="absolute -top-10 sm:-top-12 right-0 text-white hover:text-gray-300 transition-colors min-h-[40px] min-w-[40px] sm:min-h-11 sm:min-w-11"
                >
                  <X className="size-6 sm:size-8" />
                </button>
                <iframe
                  src={product.videoUrl}
                  className="w-full h-full rounded-xl sm:rounded-2xl"
                  allow="autoplay; encrypted-media; fullscreen"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* Thumbnail row */}
          {allImages.length > 1 && (
            <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setMainImage(img);
                    setImageLoaded(false);
                  }}
                  className={`relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-lg sm:rounded-xl border-2 transition-all min-h-[40px] min-w-[40px] sm:min-h-11 sm:min-w-11 ${
                    mainImage === img
                      ? "border-primary ring-2 ring-primary/30 shadow-md"
                      : "border-transparent hover:border-primary/30"
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} image ${idx + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Right Column: Product Info ── */}
        <motion.div 
          className="space-y-4 sm:space-y-5"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {/* Breadcrumb */}
          {product.category && (
            <Breadcrumb>
              <BreadcrumbList className="flex-wrap">
                <BreadcrumbItem>
                  <BreadcrumbLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate("shop");
                    }}
                    className="text-xs sm:text-sm hover:text-primary transition-colors"
                  >
                    Home
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-xs sm:text-sm" />
                <BreadcrumbItem>
                  <BreadcrumbLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate("shop", { category: product.category!.slug });
                    }}
                    className="text-xs sm:text-sm hover:text-primary transition-colors"
                  >
                    {product.category.name}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-xs sm:text-sm" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="line-clamp-1 text-xs sm:text-sm">{product.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          )}

          {/* Title */}
          <h1 className="text-xl sm:text-2xl font-bold leading-tight md:text-3xl lg:text-4xl">
            {product.name}
          </h1>

          {/* Sold Label - Social Proof */}
          {product.soldLabel && (
            <p className="text-xs sm:text-sm text-green-600 font-medium">
              {product.soldLabel}
            </p>
          )}

          {/* Rating */}
          {product.reviewCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <StarRating rating={product.averageRating} size="md" showLabel />
              <span className="text-xs sm:text-sm text-muted-foreground">
                ({product.reviewCount} {product.reviewCount === 1 ? "review" : "reviews"})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
            <span className="text-2xl sm:text-3xl font-bold text-primary">
              {formatPrice(displayPrice)}
            </span>
            {product.compareAtPrice && (
              <span className="text-base sm:text-lg text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
            {discountPercent > 0 && (
              <Badge variant="destructive" className="rounded-full px-2.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs">
                Save {discountPercent}%
              </Badge>
            )}
          </div>

          {/* Features */}
          {product.features && product.features.length > 0 && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-0.5 sm:pt-1">
              {product.features.map((feature, idx) => {
                const IconComponent = getFeatureIcon(feature.icon);
                return (
                  <div key={idx} className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-muted-foreground bg-muted/30 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                    <IconComponent className="size-3 sm:size-4 text-primary" />
                    <span className="truncate max-w-[80px] sm:max-w-none">{feature.label}</span>
                  </div>
                );
              })}
            </div>
          )}

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
            const isColorType = type.toLowerCase() === "color";

            return (
              <div key={type} className="space-y-2 sm:space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <label className="text-sm font-medium">
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </label>
                  {selected && (
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      Selected: {selected.value}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {options.map((option) => {
                    const isSelected = selected?.variantId === option.variantId;
                    const isOOS = option.isOutOfStock;
                    const colorHex = product.variants.find(v => v.id === option.variantId)?.colorHex;

                    return (
                      <button
                        key={option.variantId}
                        type="button"
                        disabled={isOOS}
                        onClick={() => handleVariantSelect(type, option)}
                        className={`relative min-h-[40px] sm:min-h-12 rounded-lg sm:rounded-xl border-2 px-3 sm:px-5 py-2 text-xs sm:text-sm font-medium transition-all ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                            : isOOS
                              ? "cursor-not-allowed border-border/30 opacity-40"
                              : "border-border hover:border-primary/50 hover:bg-accent/50"
                        }`}
                      >
                        {isColorType && colorHex ? (
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span 
                              className="size-4 sm:size-5 rounded-full border shadow-inner shrink-0"
                              style={{ backgroundColor: colorHex }}
                            />
                            <span className="truncate max-w-[60px] sm:max-w-none">{option.value}</span>
                          </div>
                        ) : (
                          <span className="truncate max-w-[80px] sm:max-w-none">{option.value}</span>
                        )}
                        {isOOS && (
                          <span className="ml-1 text-[10px] sm:text-xs">(OOS)</span>
                        )}
                        {isSelected && (
                          <Check className="ml-1 inline size-3 sm:size-4" />
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
            <div className="flex flex-wrap gap-1 sm:gap-1.5">
              {product.tags.map((tag) => (
                <Badge key={tag.id} variant="secondary" className="rounded-full text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1">
                  #{tag.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Bundle & Save */}
          {product.bundleOffers && product.bundleOffers.length > 0 && (
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-px flex-1 bg-border" />
                <h3 className="text-xs sm:text-sm font-bold tracking-wide uppercase">Bundle &amp; Save</h3>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                {product.bundleOffers.map((tier, idx) => {
                  const isSelected = selectedBundleIndex === idx;
                  const savings = tier.compareAtPrice ? tier.compareAtPrice - tier.price : 0;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedBundleIndex(idx)}
                      className={`relative w-full flex flex-wrap items-center justify-between gap-2 rounded-lg sm:rounded-xl border-2 px-3 sm:px-4 py-2.5 sm:py-3 text-left transition-all ${
                        isSelected
                          ? "border-foreground bg-muted/50"
                          : "border-border hover:border-foreground/30"
                      }`}
                    >
                      {tier.badge && (
                        <span className="absolute -top-2 right-2 sm:right-4 bg-foreground text-background text-[9px] sm:text-[11px] font-semibold px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
                          {tier.badge}
                        </span>
                      )}
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <span
                          className={`flex size-4 sm:size-5 shrink-0 items-center justify-center rounded-full border-2 ${
                            isSelected ? "border-foreground" : "border-muted-foreground/40"
                          }`}
                        >
                          {isSelected && <span className="size-2 sm:size-2.5 rounded-full bg-foreground" />}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm">{tier.label}</p>
                          {savings > 0 && (
                            <p className="text-[10px] sm:text-xs text-muted-foreground">
                              Save {formatPrice(savings)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-sm">{formatPrice(tier.price)}</p>
                        {tier.compareAtPrice && (
                          <p className="text-[10px] sm:text-xs text-muted-foreground line-through">
                            {formatPrice(tier.compareAtPrice)}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          {(!product.bundleOffers || product.bundleOffers.length === 0) && !noVariantsAvailable && !isCurrentVariantOutOfStock && allVariantTypesSelected && (
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <label className="text-sm font-medium">Quantity</label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl border flex items-center justify-center hover:bg-muted transition-colors min-h-[36px] min-w-[36px] sm:min-h-10 sm:min-w-10"
                  disabled={quantity <= 1}
                >
                  <Minus className="size-3.5 sm:size-4" />
                </button>
                <span className="w-10 sm:w-12 text-center font-medium text-base sm:text-lg">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl border flex items-center justify-center hover:bg-muted transition-colors min-h-[36px] min-w-[36px] sm:min-h-10 sm:min-w-10"
                  disabled={quantity >= maxStock}
                >
                  <Plus className="size-3.5 sm:size-4" />
                </button>
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground">
                {maxStock} available
              </span>
            </div>
          )}

          {/* Stock Urgency Bar */}
          {allVariantTypesSelected && !isCurrentVariantOutOfStock && maxStock > 0 && maxStock <= 20 && (
            <div className="rounded-lg sm:rounded-xl bg-orange-50 border border-orange-200 px-3 sm:px-4 py-2.5 sm:py-3 space-y-1.5 sm:space-y-2">
              <p className="text-xs sm:text-sm font-medium text-orange-700">
                🔥 HURRY! Only {maxStock} {maxStock === 1 ? "item" : "items"} left in stock
              </p>
              <div className="h-1.5 sm:h-2 w-full rounded-full bg-orange-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-400 to-red-500 transition-all"
                  style={{ width: `${Math.max(15, 100 - (maxStock / 20) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Bundle stock warning */}
          {product.bundleOffers && product.bundleOffers.length > 0 && quantity > maxStock && allVariantTypesSelected && (
            <p className="text-xs sm:text-sm text-destructive">
              Only {maxStock} {maxStock === 1 ? "unit" : "units"} in stock — this bundle ({quantity} units) is currently unavailable.
            </p>
          )}

          {/* Action Buttons */}
          <div className="pt-1 sm:pt-2 space-y-2.5 sm:space-y-3">
            {noVariantsAvailable ? (
              <Button
                disabled
                className="w-full min-h-[48px] sm:min-h-13 text-sm sm:text-base font-semibold rounded-xl sm:rounded-2xl"
              >
                <ShoppingCart className="size-4 sm:size-5 mr-2" />
                No variants available
              </Button>
            ) : isCurrentVariantOutOfStock && allVariantTypesSelected ? (
              <Button
                disabled
                className="w-full min-h-[48px] sm:min-h-13 text-sm sm:text-base font-semibold rounded-xl sm:rounded-2xl"
              >
                <ShoppingCart className="size-4 sm:size-5 mr-2" />
                Out of Stock
              </Button>
            ) : (
              <>
                <div className="flex gap-2 sm:gap-3">
                  <Button
                    disabled={isVariantDisabled || isAddingToCart || bundleExceedsStock}
                    onClick={handleAddToCart}
                    className="flex-1 min-h-[48px] sm:min-h-13 text-sm sm:text-base font-semibold rounded-xl sm:rounded-2xl shadow-lg shadow-primary/20 hover:shadow-xl transition-shadow"
                  >
                    {isAddingToCart ? (
                      <Loader2 className="size-4 sm:size-5 animate-spin mr-2" />
                    ) : (
                      <ShoppingCart className="size-4 sm:size-5 mr-2" />
                    )}
                    {isAddingToCart
                      ? "Adding..."
                      : !allVariantTypesSelected
                        ? "Select Options"
                        : "Add to Cart"}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className="min-h-[48px] min-w-[48px] sm:min-h-13 sm:min-w-13 rounded-xl sm:rounded-2xl border-2"
                    onClick={() => setIsWishlisted(!isWishlisted)}
                  >
                    <Heart className={`size-4 sm:size-5 transition-all ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
                  </Button>
                </div>

                <Button
                  disabled={isVariantDisabled || isAddingToCart || bundleExceedsStock}
                  onClick={async () => {
                    await handleAddToCart();
                    onNavigate("checkout");
                  }}
                  variant="outline"
                  className="w-full min-h-[48px] sm:min-h-13 text-sm sm:text-base font-semibold rounded-xl sm:rounded-2xl border-2 hover:bg-primary hover:text-primary-foreground transition-all"
                >
                  Buy Now
                </Button>
              </>
            )}
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2.5 pt-1 sm:pt-2">
            {trustBadges.map((badge, idx) => {
              const IconComponent = TRUST_ICONS[badge.icon] || ShieldCheck;
              return (
                <div key={idx} className="flex flex-col items-center text-center p-2 sm:p-3 rounded-lg sm:rounded-xl bg-muted/30">
                  <IconComponent className="size-4 sm:size-5 text-primary mb-0.5 sm:mb-1" />
                  <span className="text-[10px] sm:text-sm font-semibold leading-tight">{badge.title}</span>
                  <span className="text-[8px] sm:text-xs text-muted-foreground leading-tight">{badge.subtitle}</span>
                </div>
              );
            })}
          </div>

          {/* Category Link */}
          {product.category && (
            <button
              type="button"
              onClick={() =>
                onNavigate("shop", { category: product.category!.slug })
              }
              className="inline-block text-xs sm:text-sm font-medium text-primary hover:underline min-h-[40px] sm:min-h-11"
            >
              View all in {product.category.name}
            </button>
          )}
        </motion.div>
      </div>

      {/* ── Reviews Section ── */}
      <Separator className="my-8 sm:my-10" />

      <motion.section 
        className="space-y-4 sm:space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">
              Customer Reviews
              <span className="ml-2 text-sm sm:text-base font-normal text-muted-foreground">
                ({product.reviewCount})
              </span>
            </h2>
            {product.reviewCount > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <StarRating rating={product.averageRating} size="md" showLabel />
              </div>
            )}
          </div>
          {isAuthenticated ? (
            <Button
              variant="outline"
              className="min-h-[44px] sm:min-h-12 gap-2 rounded-full px-4 sm:px-6 border-2 hover:bg-primary hover:text-primary-foreground transition-all w-full sm:w-auto text-sm"
              onClick={() => setShowReviewForm(true)}
            >
              <PenSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Write a Review
            </Button>
          ) : (
            <Button
              variant="outline"
              className="min-h-[44px] sm:min-h-12 gap-2 rounded-full px-4 sm:px-6 border-2 w-full sm:w-auto text-sm"
              onClick={() => onNavigate("login")}
            >
              <LogIn className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Login to Review
            </Button>
          )}
        </div>

        <AnimatePresence>
          {showReviewForm && (
            <ReviewForm
              productId={product.id}
              onSubmitted={() => {
                setShowReviewForm(false);
              }}
            />
          )}
        </AnimatePresence>

        {product.reviews.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {product.reviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-xl sm:rounded-2xl border bg-card/50 backdrop-blur-sm p-4 sm:p-5 space-y-2.5 sm:space-y-3 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex size-8 sm:size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs sm:text-sm">
                      {getInitials(review.customerName)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{review.customerName}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
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
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-10 sm:py-12 text-center border rounded-xl sm:rounded-2xl bg-muted/10">
            <Package className="size-10 sm:size-12 text-muted-foreground mx-auto mb-2 sm:mb-3" />
            <p className="text-sm sm:text-base text-muted-foreground px-4">No reviews yet. Be the first to review this product!</p>
          </div>
        )}
      </motion.section>
    </motion.div>
  );
}