"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShoppingCart,
  IndianRupee,
  Users,
  Mail,
  TrendingUp,
  Clock,
  ArrowRight,
  AlertCircle,
  Loader2,
} from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AnalyticsData {
  totalOrders: number;
  revenue: number;
  pendingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  codVerificationRate: number;
  totalCustomers: number;
  subscribers: number;
  avgOrderValue: number;
  repeatPurchaseRate: number;
  totalReviews: number;
  approvedReviews: number;
  pendingReviews: number;
}

interface RecentOrder {
  id: number;
  orderNumber: string;
  status: string;
  cartTotal: number;
  createdAt: string;
  customer: { name: string; email: string; phone: string | null } | null;
  itemCount: number;
}

interface AdminDashboardProps {
  onNavigate: (view: string, data?: Record<string, unknown>) => void;
  onViewOrder: (id: number) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatINR = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(value);

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  confirmed: "secondary",
  shipped: "secondary",
  delivered: "default",
  cancelled: "destructive",
  return_requested: "outline",
  returned: "destructive",
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ── KPI Card Skeleton ─────────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
        <Skeleton className="mt-3 h-7 w-20" />
      </CardContent>
    </Card>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
        <p className="mt-3 text-2xl font-bold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

// ── Recent Orders Skeleton ────────────────────────────────────────────────────

function RecentOrdersSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-6 w-36" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AdminDashboard({ onNavigate, onViewOrder }: AdminDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsRes, ordersRes] = await Promise.all([
        fetch("/api/admin/analytics?range=today"),
        fetch("/api/admin/orders?limit=5&sortBy=newest"),
      ]);

      if (!analyticsRes.ok || !ordersRes.ok) {
        throw new Error("Failed to load dashboard data");
      }

      const analyticsJson = await analyticsRes.json();
      const ordersJson = await ordersRes.json();

      setAnalytics(analyticsJson);
      setRecentOrders(ordersJson.orders ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Loading State ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <section aria-label="Admin Dashboard Overview">
        <h1 className="mb-6 text-2xl font-bold tracking-tight">Dashboard</h1>

        {/* Pending Orders Skeleton */}
        <Skeleton className="mb-6 h-24 w-full rounded-lg" />

        {/* KPI Grid Skeleton */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <KpiSkeleton key={i} />
          ))}
        </div>

        {/* Recent Orders Skeleton */}
        <RecentOrdersSkeleton />
      </section>
    );
  }

  // ── Error State ───────────────────────────────────────────────────────────

  if (error || !analytics) {
    return (
      <section aria-label="Admin Dashboard Overview">
        <h1 className="mb-6 text-2xl font-bold tracking-tight">Dashboard</h1>
        <Card className="border-destructive/50">
          <CardContent className="flex flex-col items-center justify-center gap-3 p-8 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-sm text-muted-foreground">{error ?? "No data available"}</p>
            <Button
              variant="outline"
              onClick={fetchData}
              className="min-h-[44px]"
              aria-label="Retry loading dashboard data"
            >
              <Loader2 className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  // ── Main Dashboard ───────────────────────────────────────────────────────

  return (
    <section aria-label="Admin Dashboard Overview">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Dashboard</h1>

      {/* ── Pending Orders — Prominent Banner ──────────────────────────────── */}
      <button
        type="button"
        onClick={() => onNavigate("orders", { status: "pending" })}
        className="mb-6 flex w-full min-h-[44px] items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-left transition-colors hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/40 dark:hover:bg-amber-950/60"
        aria-label={`${analytics.pendingOrders} pending orders. Click to view pending orders.`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/60">
            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Pending Orders
            </p>
            <p className="text-2xl font-bold text-amber-900 dark:text-amber-200">
              {analytics.pendingOrders}
            </p>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
      </button>

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Orders"
          value={analytics.totalOrders.toLocaleString("en-IN")}
          icon={ShoppingCart}
        />
        <KpiCard
          label="Revenue"
          value={formatINR(analytics.revenue)}
          icon={IndianRupee}
        />
        <KpiCard
          label="Customers"
          value={analytics.totalCustomers.toLocaleString("en-IN")}
          icon={Users}
        />
        <KpiCard
          label="Subscribers"
          value={analytics.subscribers.toLocaleString("en-IN")}
          icon={Mail}
        />
        <KpiCard
          label="Avg. Order Value"
          value={formatINR(analytics.avgOrderValue)}
          icon={TrendingUp}
          className="sm:col-span-2 lg:col-span-4"
        />
      </div>

      {/* ── Recent Orders ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate("orders")}
            className="min-h-[44px] gap-1.5 text-sm"
            aria-label="View all orders"
          >
            View All
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="py-8 text-center">
              <ShoppingCart className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">No orders yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Order</TableHead>
                    <TableHead className="whitespace-nowrap">Customer</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Amount</TableHead>
                    <TableHead className="whitespace-nowrap">Date</TableHead>
                    <TableHead className="w-12">
                      <span className="sr-only">View</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id} className="cursor-pointer" onClick={() => onViewOrder(order.id)}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {order.customer?.name ?? "Guest"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant={STATUS_VARIANT[order.status] ?? "outline"}>
                          {order.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-medium">
                        {formatINR(order.cartTotal)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="min-h-[44px] min-w-[44px] p-0"
                          aria-label={`View order ${order.orderNumber}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewOrder(order.id);
                          }}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}