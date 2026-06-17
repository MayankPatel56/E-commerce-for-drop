"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  Heart,
  Star,
  ShoppingBag,
  ArrowRight,
  Clock,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CustomerDashboardProps {
  onNavigate: (view: string, data?: Record<string, unknown>) => void;
  onViewOrder?: (orderId: number) => void;
}

interface Order {
  id: number;
  orderNumber: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  cartTotal: number;
  createdAt: string;
}

interface WishlistItem {
  productId: number;
  product: {
    id: number;
    name: string;
    slug: string;
    price: number;
    primaryImage: string;
  };
  createdAt: string;
}

interface DashboardData {
  recentOrders: Order[];
  wishlistPreview: WishlistItem[];
  pendingReviewCount: number;
  totalOrders: number;
  wishlistCount: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
    new Date(dateStr)
  );
}

/* ------------------------------------------------------------------ */
/*  Status helpers                                                     */
/* ------------------------------------------------------------------ */

const STATUS_STYLES: Record<
  Order["status"],
  { bg: string; text: string; label: string }
> = {
  pending: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-800 dark:text-yellow-300",
    label: "Pending",
  },
  confirmed: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-800 dark:text-blue-300",
    label: "Confirmed",
  },
  shipped: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-800 dark:text-purple-300",
    label: "Shipped",
  },
  delivered: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-800 dark:text-green-300",
    label: "Delivered",
  },
  cancelled: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-800 dark:text-red-300",
    label: "Cancelled",
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CustomerDashboard({
  onNavigate,
  onViewOrder,
}: CustomerDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchDashboard() {
      try {
        const res = await fetch("/api/customer/dashboard");
        if (!res.ok) throw new Error("Failed to load dashboard");
        const json: DashboardData = await res.json();
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Something went wrong"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---- Handlers ---- */

  function handleOrderClick(order: Order) {
    if (onViewOrder) onViewOrder(order.id);
    else if (onNavigate) onNavigate("customer-orders");
  }

  function handleViewAllWishlist() {
    onNavigate("customer-wishlist");
  }

  function handleWishlistItemClick(slug: string) {
    onNavigate("product", { slug });
  }

  /* ---- Loading skeleton ---- */

  if (loading) {
    return <DashboardSkeleton />;
  }

  /* ---- Error state ---- */

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <ShoppingBag className="h-12 w-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{error ?? "No data available"}</p>
        <Button
          variant="outline"
          className="min-h-[44px] min-w-[44px]"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  /* ---- Render ---- */

  return (
    <div className="space-y-8">
      {/* ── Overview Cards ─────────────────────────────────────────── */}
      <section aria-label="Dashboard overview">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Total Orders */}
          <Card className="p-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Orders
              </CardTitle>
              <Package className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tracking-tight">
                {data.totalOrders}
              </p>
            </CardContent>
          </Card>

          {/* Wishlist Items */}
          <Card className="p-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Wishlist Items
              </CardTitle>
              <Heart className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tracking-tight">
                {data.wishlistCount}
              </p>
            </CardContent>
          </Card>

          {/* Pending Reviews */}
          <Card className="p-0 sm:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Reviews
              </CardTitle>
              <Star className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <p className="text-3xl font-bold tracking-tight">
                {data.pendingReviewCount}
              </p>
              {data.pendingReviewCount > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                >
                  {data.pendingReviewCount} new
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Recent Orders ──────────────────────────────────────────── */}
      <section aria-label="Recent orders">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Orders</h2>
          <Button
            variant="ghost"
            size="sm"
            className="min-h-[44px] min-w-[44px] gap-1 text-muted-foreground"
            onClick={() => onNavigate("customer-orders")}
          >
            View All <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block">
          <Card className="p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No orders yet
                    </td>
                  </tr>
                )}
                {data.recentOrders.map((order) => {
                  const style = STATUS_STYLES[order.status];
                  return (
                    <tr
                      key={order.id}
                      className="cursor-pointer border-b last:border-b-0 transition-colors hover:bg-muted/40"
                      onClick={() => handleOrderClick(order)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleOrderClick(order);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`Order ${order.orderNumber}, ${style.label}, ${formatPrice(order.cartTotal)}`}
                    >
                      <td className="px-4 py-3 font-medium">
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
                        >
                          {style.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">{formatPrice(order.cartTotal)}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>

        {/* Mobile cards */}
        <div className="flex flex-col gap-3 md:hidden">
          {data.recentOrders.length === 0 && (
            <Card className="p-6 text-center text-muted-foreground">
              No orders yet
            </Card>
          )}
          {data.recentOrders.map((order) => {
            const style = STATUS_STYLES[order.status];
            return (
              <Card
                key={order.id}
                className="cursor-pointer p-0 transition-colors hover:bg-muted/40 active:bg-muted/60"
                onClick={() => handleOrderClick(order)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleOrderClick(order);
                  }
                }}
                aria-label={`Order ${order.orderNumber}, ${style.label}, ${formatPrice(order.cartTotal)}`}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{order.orderNumber}</span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
                    >
                      {style.label}
                    </span>
                    <span className="text-sm font-medium">
                      {formatPrice(order.cartTotal)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ── Wishlist Preview ───────────────────────────────────────── */}
      <section aria-label="Wishlist preview">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Your Wishlist</h2>
          <Button
            variant="ghost"
            size="sm"
            className="min-h-[44px] min-w-[44px] gap-1 text-muted-foreground"
            onClick={handleViewAllWishlist}
          >
            View All <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {data.wishlistPreview.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <Heart className="mx-auto mb-2 h-8 w-8" />
            <p>Your wishlist is empty</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.wishlistPreview.map((item) => (
              <Card
                key={item.productId}
                className="group cursor-pointer overflow-hidden p-0 transition-colors hover:bg-muted/40"
                onClick={() => handleWishlistItemClick(item.product.slug)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleWishlistItemClick(item.product.slug);
                  }
                }}
                aria-label={item.product.name}
              >
                <div className="aspect-square overflow-hidden bg-muted">
                  <Image
                    src={item.product.primaryImage}
                    alt={item.product.name}
                    width={400}
                    height={400}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <CardContent className="p-4">
                  <p className="line-clamp-1 text-sm font-medium">
                    {item.product.name}
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {formatPrice(item.product.price)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton loader                                                    */
/* ------------------------------------------------------------------ */

function DashboardSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading dashboard">
      {/* Overview cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-5 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent orders skeleton */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-20" />
        </div>
        <Card className="hidden p-0 md:block">
          <Skeleton className="h-12 w-full" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full border-b last:border-b-0" />
          ))}
        </Card>
        <div className="flex flex-col gap-3 md:hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Wishlist skeleton */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-9 w-20" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="overflow-hidden p-0">
              <Skeleton className="aspect-square w-full" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}