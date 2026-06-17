"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  TrendingUp,
  ShoppingCart,
  Users,
  Star,
  Shield,
  AlertCircle,
  Loader2,
  IndianRupee,
  Mail,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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

type DateRange = "today" | "last7days" | "last30days" | "custom";

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatINR = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(value);

// ── Metric Card Skeleton ──────────────────────────────────────────────────────

function MetricSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
        <Skeleton className="mt-3 h-7 w-20" />
      </CardContent>
    </Card>
  );
}

// ── Metric Card ───────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  icon: Icon,
  subtitle,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
        <p className="mt-3 text-2xl font-bold tracking-tight">{value}</p>
        {subtitle && (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Small Stat ────────────────────────────────────────────────────────────────

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-card p-4">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-xl font-bold tracking-tight">{value}</span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("range", dateRange);
      if (dateRange === "custom") {
        if (!customStart || !customEnd) {
          setError("Please select both start and end dates for custom range.");
          setLoading(false);
          return;
        }
        params.set("start", customStart);
        params.set("end", customEnd);
      }

      const res = await fetch(`/api/admin/analytics?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Request failed with status ${res.status}`);
      }

      const json: AnalyticsData = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [dateRange, customStart, customEnd]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // ── Derived Metrics ───────────────────────────────────────────────────────

  const cancellationRate =
    data && data.totalOrders > 0
      ? ((data.cancelledOrders / data.totalOrders) * 100).toFixed(1)
      : "0.0";

  const approvalRate =
    data && data.totalReviews > 0
      ? ((data.approvedReviews / data.totalReviews) * 100).toFixed(1)
      : "0.0";

  const avgRating = "—"; // API does not provide avg rating; shown as placeholder

  // ── Loading State ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <section aria-label="Analytics Dashboard">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <MetricSkeleton key={i} />
          ))}
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>

        <Skeleton className="h-64 rounded-lg" />
      </section>
    );
  }

  // ── Error State ───────────────────────────────────────────────────────────

  if (error || !data) {
    return (
      <section aria-label="Analytics Dashboard">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end">
          <Skeleton className="h-10 w-48" />
        </div>
        <Card className="border-destructive/50">
          <CardContent className="flex flex-col items-center justify-center gap-3 p-8 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-sm text-muted-foreground">{error ?? "No data available"}</p>
            <Button
              variant="outline"
              onClick={fetchAnalytics}
              className="min-h-[44px]"
              aria-label="Retry loading analytics"
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
    <section aria-label="Analytics Dashboard">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>

        {/* Date Range Picker */}
        <div className="flex flex-wrap items-end gap-2 sm:ml-auto">
          <div className="w-full sm:w-auto">
            <label htmlFor="analytics-range" className="sr-only">
              Select date range
            </label>
            <Select
              value={dateRange}
              onValueChange={(v) => setDateRange(v as DateRange)}
            >
              <SelectTrigger id="analytics-range" className="min-h-[44px] w-full sm:w-[180px]">
                <Calendar className="mr-2 h-4 w-4" aria-hidden="true" />
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="last7days">Last 7 Days</SelectItem>
                <SelectItem value="last30days">Last 30 Days</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {dateRange === "custom" && (
            <>
              <div className="w-full sm:w-auto">
                <label htmlFor="analytics-start" className="sr-only">
                  Start date
                </label>
                <Input
                  id="analytics-start"
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="min-h-[44px] w-full sm:w-auto"
                  aria-label="Start date"
                />
              </div>
              <div className="w-full sm:w-auto">
                <label htmlFor="analytics-end" className="sr-only">
                  End date
                </label>
                <Input
                  id="analytics-end"
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="min-h-[44px] w-full sm:w-auto"
                  aria-label="End date"
                />
              </div>
            </>
          )}

          <Button
            variant="outline"
            onClick={fetchAnalytics}
            className="min-h-[44px] gap-1.5"
            aria-label="Refresh analytics data"
          >
            <Loader2 className="h-4 w-4" aria-hidden="true" />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── KPI Section ─────────────────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          label="Total Orders"
          value={data.totalOrders.toLocaleString("en-IN")}
          icon={ShoppingCart}
        />
        <MetricCard
          label="Revenue"
          value={formatINR(data.revenue)}
          icon={IndianRupee}
        />
        <MetricCard
          label="Customers"
          value={data.totalCustomers.toLocaleString("en-IN")}
          icon={Users}
          subtitle={`${data.repeatPurchaseRate}% repeat rate`}
        />
        <MetricCard
          label="Subscribers"
          value={data.subscribers.toLocaleString("en-IN")}
          icon={Mail}
        />
        <MetricCard
          label="Avg. Order Value"
          value={formatINR(data.avgOrderValue)}
          icon={TrendingUp}
        />
      </div>

      {/* ── COD Metrics ─────────────────────────────────────────────────────── */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle className="text-base font-semibold">COD Metrics</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SmallStat
              label="Verification Rate"
              value={`${data.codVerificationRate}%`}
            />
            <SmallStat
              label="Cancellation Rate"
              value={`${cancellationRate}%`}
            />
            <SmallStat
              label="Return Rate"
              value="—"
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Verification rate = (confirmed + shipped + delivered) / non-cancelled orders.
            Return rate data is not currently available.
          </p>
        </CardContent>
      </Card>

      {/* ── Review Metrics ──────────────────────────────────────────────────── */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle className="text-base font-semibold">Review Metrics</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <SmallStat
              label="Total Submitted"
              value={data.totalReviews.toLocaleString("en-IN")}
            />
            <SmallStat
              label="Approval Rate"
              value={`${approvalRate}%`}
            />
            <SmallStat
              label="Avg. Rating"
              value={avgRating}
            />
            <SmallStat
              label="Pending Review"
              value={data.pendingReviews.toLocaleString("en-IN")}
            />
          </div>
          {data.pendingReviews > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              {data.pendingReviews} review{data.pendingReviews > 1 ? "s" : ""} awaiting moderation.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Top Products ────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle className="text-base font-semibold">Top Products</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">#</TableHead>
                  <TableHead className="whitespace-nowrap">Product Name</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Orders</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="whitespace-nowrap" colSpan={4}>
                    <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                      <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                      <span className="text-sm">Top products data will be available soon</span>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}