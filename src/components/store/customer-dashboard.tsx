"use client";

import { useEffect, useState, type ReactNode, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Heart,
  Star,
  ShoppingBag,
  ArrowRight,
  Clock,
  TrendingUp,
  Award,
  Gift,
  ChevronRight,
  ShoppingCart,
  Eye,
  Calendar,
  IndianRupee,
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

function getStatusColor(status: Order["status"]): string {
  const colors = {
    pending: "bg-orange-500/10 text-orange-600 border-orange-200",
    confirmed: "bg-blue-500/10 text-blue-600 border-blue-200",
    shipped: "bg-violet-500/10 text-violet-600 border-violet-200",
    delivered: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
    cancelled: "bg-red-500/10 text-red-600 border-red-200",
  };
  return colors[status] || colors.pending;
}

function getStatusDot(status: Order["status"]): string {
  const colors = {
    pending: "bg-orange-500",
    confirmed: "bg-blue-500",
    shipped: "bg-violet-500",
    delivered: "bg-emerald-500",
    cancelled: "bg-red-500",
  };
  return colors[status] || colors.pending;
}

/* ------------------------------------------------------------------ */
/*  Small building blocks                                              */
/* ------------------------------------------------------------------ */

function SectionHeader({ 
  label, 
  title, 
  actionLabel, 
  onAction 
}: { 
  label: string; 
  title: string; 
  actionLabel?: string; 
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="h-[3px] w-6 bg-gradient-to-r from-orange-500 to-orange-400 rounded-full" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {label}
          </span>
        </div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
      </div>
      {actionLabel && onAction && (
        <Button
          variant="ghost"
          size="sm"
          className="group min-h-[44px] gap-1 text-muted-foreground hover:text-orange-600 transition-all"
          onClick={onAction}
        >
          {actionLabel}
          <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      )}
    </div>
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-4 py-12 text-center"
    >
      <div className="relative">
        <div className="absolute inset-0 bg-primary/5 rounded-full blur-2xl" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          {icon}
        </div>
      </div>
      <div className="space-y-1">
        <p className="font-semibold text-foreground text-lg">{heading}</p>
        <p className="text-sm text-muted-foreground">{subtext}</p>
      </div>
      <Button
        className="mt-2 min-h-[44px] rounded-full px-6 shadow-lg shadow-primary/20 hover:shadow-xl transition-all"
        onClick={onCta}
      >
        {ctaLabel}
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </motion.div>
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

  // Calculate member tier based on total orders
  const memberTier = useMemo(() => {
    if (!data) return { label: "New", color: "text-gray-500", icon: Gift };
    if (data.totalOrders >= 50) return { label: "Gold", color: "text-amber-500", icon: Award };
    if (data.totalOrders >= 20) return { label: "Silver", color: "text-gray-400", icon: Award };
    if (data.totalOrders >= 5) return { label: "Bronze", color: "text-orange-600", icon: Award };
    return { label: "New", color: "text-gray-500", icon: Gift };
  }, [data]);

  /* ---- Loading skeleton ---- */

  if (loading) {
    return <DashboardSkeleton />;
  }

  /* ---- Error state ---- */

  if (error || !data) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center gap-6 py-20 text-center"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-destructive/5 rounded-full blur-2xl" />
          <ShoppingBag className="h-16 w-16 text-muted-foreground/30 relative" />
        </div>
        <div className="space-y-1">
          <p className="text-lg font-semibold text-foreground">Unable to load dashboard</p>
          <p className="text-sm text-muted-foreground">{error ?? "No data available"}</p>
        </div>
        <Button
          variant="outline"
          className="min-h-[44px] rounded-full px-6"
          onClick={() => window.location.reload()}
        >
          Try Again
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </motion.div>
    );
  }

  /* ---- Render ---- */

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10"
    >
      {/* ── Welcome Section ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent rounded-2xl border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-foreground">Welcome back! 👋</h2>
            <Badge variant="outline" className={`${memberTier.color} border-current`}>
              <memberTier.icon className="h-3 w-3 mr-1" />
              {memberTier.label} Member
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Here's what's happening with your account
          </p>
        </div>
        <Button
          variant="outline"
          className="min-h-[44px] rounded-full"
          onClick={() => onNavigate("customer-profile")}
        >
          <Eye className="h-4 w-4 mr-2" />
          View Profile
        </Button>
      </div>

      {/* ── Overview Cards ─────────────────────────────────────────── */}
      <section aria-label="Dashboard overview">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Orders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card className="group overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-foreground to-foreground/95 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/60">
                      Total Orders
                    </p>
                    <p className="mt-3 text-4xl font-bold tracking-tight text-white">
                      {data.totalOrders}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm group-hover:scale-110 transition-transform">
                    <Package className="h-5 w-5 text-orange-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground/60 border-t border-white/10 pt-3">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>{data.totalOrders > 0 ? `Last order: ${formatDate(data.recentOrders[0]?.createdAt || new Date().toISOString())}` : "No orders yet"}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Wishlist Items */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="group overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-rose-500 to-rose-600 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-white/60">
                      Wishlist
                    </p>
                    <p className="mt-3 text-4xl font-bold tracking-tight text-white">
                      {data.wishlistCount}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm group-hover:scale-110 transition-transform">
                    <Heart className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-white/60 border-t border-white/20 pt-3">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>{data.wishlistCount > 0 ? `${data.wishlistCount} items saved` : "Nothing saved yet"}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pending Reviews */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="group overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-amber-500 to-orange-500 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-white/60">
                      Pending Reviews
                    </p>
                    <p className="mt-3 text-4xl font-bold tracking-tight text-white">
                      {data.pendingReviewCount}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm group-hover:scale-110 transition-transform">
                    <Star className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-white/60 border-t border-white/20 pt-3">
                  <Award className="h-3.5 w-3.5" />
                  <span>{data.pendingReviewCount > 0 ? `${data.pendingReviewCount} reviews needed` : "All caught up!"}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Member Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="overflow-hidden rounded-2xl border bg-gradient-to-br from-violet-500 to-purple-600 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-white/60">
                      Member Progress
                    </p>
                    <p className="mt-3 text-2xl font-bold tracking-tight text-white">
                      {memberTier.label}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs text-white/60">
                    <span>Progress to Silver</span>
                    <span>{Math.min((data.totalOrders / 5) * 100, 100)}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/20 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-white transition-all duration-500"
                      style={{ width: `${Math.min((data.totalOrders / 5) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ── Recent Orders ──────────────────────────────────────────── */}
      <section aria-label="Recent orders">
        <SectionHeader
          label="Orders"
          title="Recent Orders"
          actionLabel="View All"
          onAction={() => onNavigate("customer-orders")}
        />

        {/* Desktop table */}
        <div className="hidden md:block">
          <Card className="overflow-hidden rounded-2xl border shadow-sm">
            {data.recentOrders.length === 0 ? (
              <EmptyState
                icon={<Package className="h-6 w-6 text-orange-500" />}
                heading="No orders yet"
                subtext="Your future fits will show up here."
                ctaLabel="Start shopping"
                onCta={handleBrowseShop}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Order
                      </th>
                      <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Total
                      </th>
                      <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Date
                      </th>
                      <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentOrders.map((order, index) => (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="cursor-pointer border-t transition-colors hover:bg-muted/30 group"
                        onClick={() => handleOrderClick(order)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleOrderClick(order);
                          }
                        }}
                      >
                        <td className="px-6 py-4 font-mono font-semibold text-foreground text-sm">
                          #{order.orderNumber}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)} border`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${getStatusDot(order.status)}`} />
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-foreground">
                          {formatPrice(order.cartTotal)}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOrderClick(order);
                            }}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Mobile cards */}
        <div className="flex flex-col gap-3 md:hidden">
          {data.recentOrders.length === 0 ? (
            <Card className="rounded-2xl border shadow-sm">
              <EmptyState
                icon={<Package className="h-6 w-6 text-orange-500" />}
                heading="No orders yet"
                subtext="Your future fits will show up here."
                ctaLabel="Start shopping"
                onCta={handleBrowseShop}
              />
            </Card>
          ) : (
            data.recentOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="cursor-pointer rounded-2xl border shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
                  onClick={() => handleOrderClick(order)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleOrderClick(order);
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1.5">
                        <span className="font-mono font-semibold text-foreground text-sm">
                          #{order.orderNumber}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${getStatusColor(order.status)}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${getStatusDot(order.status)}`} />
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(order.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">
                          {formatPrice(order.cartTotal)}
                        </p>
                        <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* ── Wishlist Preview ───────────────────────────────────────── */}
      <section aria-label="Wishlist preview">
        <SectionHeader
          label="Saved"
          title="Your Wishlist"
          actionLabel="View All"
          onAction={handleViewAllWishlist}
        />

        {data.wishlistPreview.length === 0 ? (
          <Card className="rounded-2xl border border-dashed shadow-none bg-muted/5">
            <EmptyState
              icon={<Heart className="h-6 w-6 text-rose-500" />}
              heading="Nothing saved yet"
              subtext="Tap the heart on anything you love — it'll land here."
              ctaLabel="Browse the shop"
              onCta={handleBrowseShop}
            />
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {data.wishlistPreview.map((item, index) => (
              <motion.div
                key={item.productId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="group cursor-pointer overflow-hidden rounded-2xl border shadow-sm transition-all hover:shadow-xl hover:-translate-y-1"
                  onClick={() => handleWishlistItemClick(item.product.slug)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleWishlistItemClick(item.product.slug);
                    }
                  }}
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <Image
                      src={item.product.primaryImage || "/placeholder.png"}
                      alt={item.product.name}
                      width={400}
                      height={400}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-foreground/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="rounded-full shadow-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWishlistItemClick(item.product.slug);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </div>
                    <Badge 
                      className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-foreground border-0"
                    >
                      <Heart className="h-3 w-3 fill-rose-500 text-rose-500 mr-1" />
                      Wishlist
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <p className="line-clamp-1 text-sm font-medium text-foreground">
                      {item.product.name}
                    </p>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="font-bold text-foreground">
                        {formatPrice(item.product.price)}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWishlistItemClick(item.product.slug);
                        }}
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton loader                                                    */
/* ------------------------------------------------------------------ */

function DashboardSkeleton() {
  return (
    <div className="space-y-10" aria-busy="true" aria-label="Loading dashboard">
      {/* Welcome skeleton */}
      <div className="p-6 rounded-2xl border bg-muted/10">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Overview cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="overflow-hidden rounded-2xl border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-9 w-12" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
              <Skeleton className="mt-4 h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent orders skeleton */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-9 w-20" />
        </div>
        <Card className="hidden overflow-hidden rounded-2xl border shadow-sm md:block">
          <Skeleton className="h-12 w-full rounded-none" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-none border-t" />
          ))}
        </Card>
        <div className="flex flex-col gap-3 md:hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="rounded-2xl border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <div className="text-right space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-4 ml-auto" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Wishlist skeleton */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-6 w-28" />
          </div>
          <Skeleton className="h-9 w-20" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="overflow-hidden rounded-2xl border shadow-sm">
              <Skeleton className="aspect-square w-full" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}