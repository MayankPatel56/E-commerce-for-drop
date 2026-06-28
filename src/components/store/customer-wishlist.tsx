"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Heart,
  Trash2,
  ArrowRight,
  Package,
  Loader2,
  ShoppingCart,
} from "lucide-react";

import { useCart } from "@/context/cart-context";

interface CustomerWishlistProps {
  onNavigate: (view: string, data?: Record<string, unknown>) => void;
}

interface WishlistProduct {
  productId: number;
  product: {
    id: number;
    name: string;
    slug: string;
    price: number;
    primaryImage: string | null;
    isPublished: boolean;
  };
  createdAt: string;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function CustomerWishlist({ onNavigate }: CustomerWishlistProps) {
  const { addItem } = useCart();
  const [items, setItems] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const fetchWishlist = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/customer/wishlist");
      if (!res.ok) {
        throw new Error("Failed to fetch wishlist");
      }
      const data: WishlistProduct[] = await res.json();
      setItems(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleRemove = async (productId: number) => {
    const previousItems = [...items];
    setRemovingId(productId);
    setItems((prev) => prev.filter((item) => item.productId !== productId));

    try {
      const res = await fetch(`/api/customer/wishlist/${productId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to remove item");
      }
    } catch {
      setItems(previousItems);
    } finally {
      setRemovingId(null);
    }
  };

  const handleViewProduct = (slug: string) => {
    onNavigate("product", { slug });
  };

  // ── Loading skeleton ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="px-4 py-6">
        <div className="mb-6 flex items-center gap-2">
          <Heart className="h-5 w-5 text-rose-500" />
          <h2 className="text-xl font-semibold">My Wishlist</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="mb-3 aspect-square w-full rounded-lg" />
                <Skeleton className="mb-2 h-4 w-3/4" />
                <Skeleton className="mb-3 h-4 w-1/3" />
                <Skeleton className="h-11 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────
  if (error) {
    return (
      <div className="px-4 py-6">
        <div className="mb-6 flex items-center gap-2">
          <Heart className="h-5 w-5 text-rose-500" />
          <h2 className="text-xl font-semibold">My Wishlist</h2>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={fetchWishlist} className="min-h-[44px]">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="px-4 py-6">
        <div className="mb-6 flex items-center gap-2">
          <Heart className="h-5 w-5 text-rose-500" />
          <h2 className="text-xl font-semibold">My Wishlist</h2>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Heart className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium">Your wishlist is empty</p>
            <p className="text-sm text-muted-foreground">
              Save items you love to your wishlist. Review them anytime.
            </p>
            <Button onClick={() => onNavigate("shop")} className="mt-2 min-h-[44px]">
              Browse Products
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Product grid ──────────────────────────────────────────────────
  return (
    <div className="px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-rose-500" />
          <h2 className="text-xl font-semibold">My Wishlist</h2>
          <Badge variant="secondary" className="ml-1">
            {items.length}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const isRemoving = removingId === item.productId;

          return (
            <Card
              key={item.productId}
              className={`group relative transition-opacity duration-200 ${
                isRemoving ? "pointer-events-none opacity-50" : ""
              }`}
            >
              {/* Remove button — absolute top-right */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 z-10 h-9 w-9 rounded-full bg-background/80 text-muted-foreground backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => handleRemove(item.productId)}
                disabled={isRemoving}
                aria-label={`Remove ${item.product.name} from wishlist`}
              >
                {isRemoving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>

              <CardContent className="p-4">
                {/* Product image */}
                <button
                  type="button"
                  onClick={() => handleViewProduct(item.product.slug)}
                  className="mb-3 block w-full overflow-hidden rounded-lg"
                  aria-label={`View ${item.product.name}`}
                >
                  {item.product.primaryImage ? (
                    <Image
                      src={item.product.primaryImage}
                      alt={item.product.name}
                      width={400}
                      height={400}
                      className="aspect-square w-full rounded-lg object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-muted">
                      <Package className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                  )}
                </button>

                {/* Product name */}
                <button
                  type="button"
                  onClick={() => handleViewProduct(item.product.slug)}
                  className="mb-1 block w-full text-left text-sm font-medium leading-tight hover:underline min-h-[44px] flex items-center"
                >
                  {item.product.name}
                </button>

                {/* Price */}
                <p className="mb-3 text-sm font-semibold text-foreground">
                  {formatPrice(item.product.price)}
                </p>

                {!item.product.isPublished && (
                  <Badge variant="outline" className="mb-3 text-xs">
                    Unpublished
                  </Badge>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 min-h-[44px] text-xs"
                    onClick={() => handleViewProduct(item.product.slug)}
                  >
                    View
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 min-h-[44px] text-xs"
                    onClick={() => {
                      addItem({
                        variantId: 0,
                        productId: item.productId,
                        productName: item.product.name,
                        variantDescription: "",
                        price: item.product.price,
                        quantity: 1,
                        imageUrl: item.product.primaryImage ?? "",
                        stockAvailable: 99,
                      });
                      onNavigate("product", { slug: item.product.slug });
                    }}
                  >
                    <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
                    Add to Cart
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}