"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Search,
  Eye,
  Clock,
  Loader2,
  Package,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "return_requested"
  | "returned";

interface Order {
  id: number;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  } | null;
  itemCount: number;
  cartTotal: number;
  status: OrderStatus;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface OrdersResponse {
  orders: Order[];
  pendingCount: number;
  pagination: PaginationInfo;
}

interface OrdersTableProps {
  onViewOrder: (orderId: number) => void;
  onRefresh?: () => void;
}

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "return_requested", label: "Return Requested" },
  { value: "returned", label: "Returned" },
];

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
];

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  shipped: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  return_requested: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  returned: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  return_requested: "Return Requested",
  returned: "Returned",
};

const PAGE_LIMIT = 20;

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatStatus(status: OrderStatus): string {
  return STATUS_LABELS[status] ?? status;
}

// ── Component ────────────────────────────────────────────────────────────────

export function OrdersTable({ onViewOrder, onRefresh }: OrdersTableProps) {
  // Data
  const [orders, setOrders] = useState<Order[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  // Pagination
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: PAGE_LIMIT,
    total: 0,
    totalPages: 0,
  });

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("limit", String(PAGE_LIMIT));
      params.set("sortBy", sortBy);

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch orders");

      const data: OrdersResponse = await res.json();
      setOrders(data.orders ?? []);
      setPendingCount(data.pendingCount ?? 0);
      setPagination(data.pagination ?? { page: 1, limit: PAGE_LIMIT, total: 0, totalPages: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, sortBy, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Debounced search (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Notify parent on data change
  

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setPage(1);
  };

  const handleRowClick = (orderId: number) => {
    onViewOrder(orderId);
  };

  // ── Computed ─────────────────────────────────────────────────────────────

  const rangeStart = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const rangeEnd = Math.min(pagination.page * pagination.limit, pagination.total);

  const emptyMessage = (() => {
    if (statusFilter !== "all") {
      return `No ${formatStatus(statusFilter as OrderStatus).toLowerCase()} orders found.`;
    }
    if (search) {
      return `No orders matching "${search}" found.`;
    }
    return "No orders yet. Orders will appear here once customers place them.";
  })();

  // ── Skeleton ─────────────────────────────────────────────────────────────

  const TableSkeleton = () => (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 p-3 border-b">
          <Skeleton className="h-5 w-full sm:w-[110px]" />
          <Skeleton className="h-5 w-full sm:w-[160px]" />
          <Skeleton className="h-5 w-full sm:w-[50px]" />
          <Skeleton className="h-5 w-full sm:w-[80px]" />
          <Skeleton className="h-5 w-full sm:w-[80px]" />
          <Skeleton className="h-5 w-full sm:w-[90px]" />
          <Skeleton className="h-5 w-full sm:w-[60px]" />
        </div>
      ))}
    </div>
  );

  const CardSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-[110px]" />
              <Skeleton className="h-5 w-[80px]" />
            </div>
            <Skeleton className="h-4 w-[140px]" />
            <Skeleton className="h-4 w-[80px]" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // ── Mobile Card ──────────────────────────────────────────────────────────

  const MobileCard = ({ order }: { order: Order }) => (
    <Card
      className="cursor-pointer transition-colors hover:bg-muted/50 active:bg-muted/80"
      onClick={() => handleRowClick(order.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleRowClick(order.id);
        }
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-sm font-medium">{order?.orderNumber || "—"}</span>
          <Badge
            variant="outline"
            className={STATUS_STYLES[order?.status || "pending"]}
          >
            {formatStatus(order?.status || "pending")}
          </Badge>
        </div>
        <p className="text-sm font-medium truncate">{order?.customer?.name || "Guest Checkout"}</p>
        <p className="text-xs text-muted-foreground truncate">{order?.customer?.email || "—"}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-muted-foreground">
            {`${order?.itemCount || 0} item${order?.itemCount !== 1 ? "s" : ""}`} &middot; {formatDate(order?.createdAt || new Date().toISOString())}
          </span>
          <span className="text-sm font-semibold">{formatCurrency(order?.cartTotal || 0)}</span>
        </div>
      </CardContent>
    </Card>
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header + Pending Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-xl font-semibold tracking-tight">Orders</h2>
          {pendingCount > 0 && (
            <Badge
              variant="outline"
              className="gap-1.5 border-yellow-300 bg-yellow-50 text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 px-3 py-1 text-sm font-medium"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-yellow-500" />
              </span>
              <Clock className="h-3.5 w-3.5" />
              {pendingCount} Pending Order{pendingCount !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading orders…
            </span>
          ) : (
            `${pagination.total} order${pagination.total !== 1 ? "s" : ""} total`
          )}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by order number…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 min-h-[44px]"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-[180px] min-h-[44px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-full sm:w-[180px] min-h-[44px]">
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

      {/* Error State */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">Failed to load orders</p>
            <p className="text-sm text-muted-foreground mt-0.5">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 min-h-[44px]"
              onClick={() => fetchOrders()}
            >
              <Loader2 className="h-3.5 w-3.5 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Loading State – Mobile Cards */}
      {isLoading && <div className="md:hidden"><CardSkeleton /></div>}

      {/* Loading State – Desktop Table */}
      {isLoading && <div className="hidden md:block"><TableSkeleton /></div>}

      {/* Empty State */}
      {!isLoading && !error && orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
          <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">No orders found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">{emptyMessage}</p>
        </div>
      )}

      {/* Mobile Cards */}
      {!isLoading && !error && orders.length > 0 && (
        <div className="space-y-3 md:hidden">
          {orders.map((order) => (
            <MobileCard key={order.id} order={order} />
          ))}
        </div>
      )}

      {/* Desktop Table */}
      {!isLoading && !error && orders.length > 0 && (
        <div className="hidden md:block">
          <div className="max-h-[calc(100vh-18rem)] overflow-y-auto rounded-md border scrollbar-thin">
            <div className="min-w-[740px]">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="min-w-[120px]">Order #</TableHead>
                    <TableHead className="min-w-[180px]">Customer</TableHead>
                    <TableHead className="min-w-[70px]">Items</TableHead>
                    <TableHead className="min-w-[90px] text-right">Total</TableHead>
                    <TableHead className="min-w-[110px]">Status</TableHead>
                    <TableHead className="min-w-[110px]">Date</TableHead>
                    <TableHead className="min-w-[80px] text-right">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer"
                      onClick={() => handleRowClick(order.id)}
                    >
                      <TableCell>
                        <span className="font-mono text-sm font-medium">
                          {order?.orderNumber || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium truncate max-w-[200px]">
                            {order?.customer?.name || "Guest Checkout"}
                          </span>
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {order?.customer?.email || "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {`${order?.itemCount || 0} item${order?.itemCount !== 1 ? "s" : ""}`}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold">
                          {formatCurrency(order?.cartTotal || 0)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={STATUS_STYLES[order?.status || "pending"]}
                        >
                          {formatStatus(order?.status || "pending")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(order?.createdAt || new Date().toISOString())}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="min-h-[44px] min-w-[44px]"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(order.id);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View order {order?.orderNumber || ""}</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !error && pagination.totalPages > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground order-2 sm:order-1">
            Showing{" "}
            <span className="font-medium text-foreground">{rangeStart}</span>
            {"–"}
            <span className="font-medium text-foreground">{rangeEnd}</span>
            {" of "}
            <span className="font-medium text-foreground">{pagination.total}</span>
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
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="min-h-[44px] min-w-[44px]"
            >
              <span className="sr-only sm:not-sr-only">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}