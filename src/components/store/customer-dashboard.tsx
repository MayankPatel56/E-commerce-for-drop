"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
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

type StatusStyle = {
  dot: string;
  text: string;
  border: string;
  label: string;
};

const STATUS_STYLES: Record<Order["status"], StatusStyle> = {
  pending: {
    dot: "bg-orange-500",
    text: "text-orange-700",
    border: "border-orange-500",
    label: "Pending",
  },
  confirmed: {
    dot: "bg-sky-600",
    text: "text-sky-700",
    border: "border-sky-600",
    label: "Confirmed",
  },
  shipped: {
    dot: "bg-violet-600",
    text: "text-violet-700",
    border: "border-violet-600",
    label: "Shipped",
  },
  delivered: {
    dot: "bg-emerald-600",
    text: "text-emerald-700",
    border: "border-emerald-600",
    label: "Delivered",
  },
  cancelled: {
    dot: "bg-red-600",
    text: "text-red-700",
    border: "border-red-600",
    label: "Cancelled",
  },
};

/* ------------------------------------------------------------------ */
/*  Small building blocks                                              */
/* ------------------------------------------------------------------ */

function SectionEyebrow({ label, title }: { label: string; title: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        <span className="h-[3px] w-6 bg-orange-500" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
          {label}
        </span>
      </div>
      <h2 className="text-lg font-bold text-neutral-900">{title}</h2>
    </div>
  );
}

function ViewAllButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="min-h-[44px] min-w-[44px] gap-1 text-neutral-500 hover:text-orange-600 focus-visible:ring-2 focus-visible:ring-orange-500"
      onClick={onClick}
    >
      View All <ArrowRight className="h-4 w-4" />
    </Button>
  );
}

function EmptyState({
  icon,
  heading,
  subtext,
  ctaLabel,
  onCta,
}: {
  icon: ReactNode;
  heading: string;
  subtext: string;
  ctaLabel: string;
  onCta: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50">
        {icon}
      </span>
      <div>
        <p className="font-semibold text-neutral-900">{heading}</p>
        <p className="text-sm text-neutral-500">{subtext}</p>
      </div>
      <Button
        size="sm"
        className="mt-1 min-h-[44px] bg-neutral-950 text-white hover:bg-orange-600 focus-visible:ring-2 focus-visible:ring-orange-500"
        onClick={onCta}
      >
        {ctaLabel}
      </Button>
    </div>
  );
}

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

  function handleBrowseShop() {
    onNavigate("shop");
  }

  /* ---- Loading skeleton ---- */

  if (loading) {
    return <DashboardSkeleton />;
  }

  /* ---- Error state ---- */

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <ShoppingBag className="h-12 w-12 text-neutral-300" />
        <p className="text-sm text-neutral-500">{error ?? "No data available"}</p>
        <Button
          variant="outline"
          className="min-h-[44px] min-w-[44px] border-neutral-300 hover:bg-neutral-950 hover:text-white focus-visible:ring-2 focus-visible:ring-orange-500"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  /* ---- Render ---- */

  return (
    <div className="space-y-10">
      {/* ── Overview Cards ─────────────────────────────────────────── */}
      <section aria-label="Dashboard overview">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Total Orders */}
          <Card className="overflow-hidden rounded-2xl border-0 bg-neutral-950 p-0">
            <CardContent className="p-5 pb-4">
              <div className="flex items-start justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                  Total Orders
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-800">
                  <Package className="h-4 w-4 text-orange-500" />
                </span>
              </div>
              <p className="mt-4 text-5xl font-bold tabular-nums tracking-tight text-white">
                {data.totalOrders}
              </p>
            </CardContent>
            <div className="border-t border-dashed border-neutral-800 px-5 py-2.5">
              <span className="text-[11px] text-neutral-500">
                All-time orders placed
              </span>
            </div>
          </Card>

          {/* Wishlist Items */}
          <Card className="overflow-hidden rounded-2xl border-0 bg-neutral-950 p-0">
            <CardContent className="p-5 pb-4">
              <div className="flex items-start justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                  Wishlist Items
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-800">
                  <Heart className="h-4 w-4 text-orange-500" />
                </span>
              </div>
              <p className="mt-4 text-5xl font-bold tabular-nums tracking-tight text-white">
                {data.wishlistCount}
              </p>
            </CardContent>
            <div className="border-t border-dashed border-neutral-800 px-5 py-2.5">
              <span className="text-[11px] text-neutral-500">
                Saved for later
              </span>
            </div>
          </Card>

          {/* Pending Reviews */}
          <Card className="overflow-hidden rounded-2xl border-0 bg-neutral-950 p-0 sm:col-span-2 lg:col-span-1">
            <CardContent className="p-5 pb-4">
              <div className="flex items-start justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                  Pending Reviews
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-800">
                  <Star className="h-4 w-4 text-orange-500" />
                </span>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <p className="text-5xl font-bold tabular-nums tracking-tight text-white">
                  {data.pendingReviewCount}
                </p>
                {data.pendingReviewCount > 0 && (
                  <span className="rounded-full bg-orange-500 px-2.5 py-1 text-xs font-semibold text-neutral-950">
                    {data.pendingReviewCount} new
                  </span>
                )}
              </div>
            </CardContent>
            <div className="border-t border-dashed border-neutral-800 px-5 py-2.5">
              <span className="text-[11px] text-neutral-500">
                Waiting for your feedback
              </span>
            </div>
          </Card>
        </div>
      </section>

      {/* ── Recent Orders ──────────────────────────────────────────── */}
      <section aria-label="Recent orders">
        <div className="mb-4 flex items-center justify-between">
          <SectionEyebrow label="Orders" title="Recent Orders" />
          <ViewAllButton onClick={() => onNavigate("customer-orders")} />
        </div>

        {/* Desktop table */}
        <div className="hidden md:block">
          <Card className="overflow-hidden rounded-2xl border-0 p-0 shadow-sm">
            {data.recentOrders.length === 0 ? (
              <EmptyState
                icon={<Package className="h-5 w-5 text-orange-600" />}
                heading="No orders yet"
                subtext="Your future fits will show up here."
                ctaLabel="Start shopping"
                onCta={handleBrowseShop}
              />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-950">
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                      Order
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((order) => {
                    const style = STATUS_STYLES[order.status];
                    return (
                      <tr
                        key={order.id}
                        className="cursor-pointer border-b border-neutral-100 last:border-b-0 transition-colors hover:bg-orange-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-inset"
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
                        <td className="px-4 py-3 font-mono font-semibold text-neutral-900">
                          {order.orderNumber}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                            <span className={`text-sm font-medium ${style.text}`}>
                              {style.label}
                            </span>
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-neutral-900">
                          {formatPrice(order.cartTotal)}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-neutral-500">
                          {formatDate(order.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        {/* Mobile cards */}
        <div className="flex flex-col gap-3 md:hidden">
          {data.recentOrders.length === 0 ? (
            <Card className="rounded-2xl border-0 p-0 shadow-sm">
              <EmptyState
                icon={<Package className="h-5 w-5 text-orange-600" />}
                heading="No orders yet"
                subtext="Your future fits will show up here."
                ctaLabel="Start shopping"
                onCta={handleBrowseShop}
              />
            </Card>
          ) : (
            data.recentOrders.map((order) => {
              const style = STATUS_STYLES[order.status];
              return (
                <Card
                  key={order.id}
                  className={`cursor-pointer rounded-2xl border-0 border-l-4 ${style.border} p-0 shadow-sm transition-colors hover:bg-orange-50/40 active:bg-orange-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500`}
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
                      <span className="font-mono font-semibold text-neutral-900">
                        {order.orderNumber}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-neutral-500">
                        <Clock className="h-3 w-3" />
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                        <span className={`text-xs font-medium ${style.text}`}>
                          {style.label}
                        </span>
                      </span>
                      <span className="text-sm font-semibold text-neutral-900">
                        {formatPrice(order.cartTotal)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </section>

      {/* ── Wishlist Preview ───────────────────────────────────────── */}
      <section aria-label="Wishlist preview">
        <div className="mb-4 flex items-center justify-between">
          <SectionEyebrow label="Saved" title="Your Wishlist" />
          <ViewAllButton onClick={handleViewAllWishlist} />
        </div>

        {data.wishlistPreview.length === 0 ? (
          <Card className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/50 p-0 shadow-none">
            <EmptyState
              icon={<Heart className="h-5 w-5 text-orange-600" />}
              heading="Nothing saved yet"
              subtext="Tap the heart on anything you love — it'll land here."
              ctaLabel="Browse the shop"
              onCta={handleBrowseShop}
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.wishlistPreview.map((item) => (
              <Card
                key={item.productId}
                className="group cursor-pointer overflow-hidden rounded-2xl border-0 p-0 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
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
                <div className="relative aspect-square overflow-hidden bg-neutral-100">
                  <Image
                    src={item.product.primaryImage}
                    alt={item.product.name}
                    width={400}
                    height={400}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-neutral-950/85 via-neutral-950/0 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span className="flex items-center gap-1 p-4 text-sm font-semibold text-orange-400">
                      View product <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="line-clamp-1 text-sm font-medium text-neutral-900">
                    {item.product.name}
                  </p>
                  <p className="mt-1 font-mono text-sm font-semibold text-neutral-900">
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
    <div className="space-y-10" aria-busy="true" aria-label="Loading dashboard">
      {/* Overview cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="overflow-hidden rounded-2xl border-0 bg-neutral-950 p-0">
            <CardContent className="p-5 pb-4">
              <div className="flex items-start justify-between">
                <Skeleton className="h-3 w-20 bg-white/10" />
                <Skeleton className="h-8 w-8 rounded-full bg-white/10" />
              </div>
              <Skeleton className="mt-4 h-10 w-16 bg-white/10" />
            </CardContent>
            <div className="border-t border-dashed border-neutral-800 px-5 py-2.5">
              <Skeleton className="h-3 w-24 bg-white/10" />
            </div>
          </Card>
        ))}
      </div>

      {/* Recent orders skeleton */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <Skeleton className="mb-2 h-3 w-14" />
            <Skeleton className="h-5 w-32" />
          </div>
          <Skeleton className="h-9 w-20" />
        </div>
        <Card className="hidden overflow-hidden rounded-2xl border-0 p-0 shadow-sm md:block">
          <Skeleton className="h-11 w-full rounded-none bg-neutral-900" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-none border-b border-neutral-100 last:border-b-0" />
          ))}
        </Card>
        <div className="flex flex-col gap-3 md:hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="rounded-2xl border-0 p-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Skeleton className="h-4 w-16 rounded-full" />
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
          <div>
            <Skeleton className="mb-2 h-3 w-12" />
            <Skeleton className="h-5 w-28" />
          </div>
          <Skeleton className="h-9 w-20" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="overflow-hidden rounded-2xl border-0 p-0 shadow-sm">
              <Skeleton className="aspect-square w-full rounded-none" />
              <CardContent className="space-y-2 p-4">
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