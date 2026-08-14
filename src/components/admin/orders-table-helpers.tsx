"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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

export function OrdersTableSkeleton() {
  return (
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
}

export function OrdersCardSkeleton() {
  return (
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
}

interface OrderMobileCardProps {
  order: Order;
  onRowClick: (orderId: number) => void;
}

export function OrderMobileCard({ order, onRowClick }: OrderMobileCardProps) {
  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-muted/50 active:bg-muted/80"
      onClick={() => onRowClick(order.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onRowClick(order.id);
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
}
