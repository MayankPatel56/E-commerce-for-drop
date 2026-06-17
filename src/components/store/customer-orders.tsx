"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Loader2,
  AlertCircle,
  Inbox,
} from "lucide-react";

interface CustomerOrdersProps {
  onNavigate: (view: string, data?: Record<string, unknown>) => void;
}

interface OrderItem {
  id: number;
  variantSnapshot: {
    sku?: string;
    variantType?: string;
    variantValue?: string;
    productName?: string;
  } | null;
  quantity: number;
  unitPrice: number;
}

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  cartTotal: number;
  createdAt: string;
  orderItems: OrderItem[];
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  confirmed: "secondary",
  shipped: "default",
  delivered: "secondary",
  cancelled: "destructive",
  return_requested: "outline",
  returned: "secondary",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  return_requested: "Return Requested",
  returned: "Returned",
};

export function CustomerOrders({ onNavigate }: CustomerOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/customer/orders?page=${page}&limit=${limit}`);
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data.orders ?? []);
      setTotalPages(data.totalPages ?? 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (loading) {
    return (
      <div className="px-4 py-6">
        <div className="mb-6 flex items-center gap-2">
          <Package className="h-5 w-5" />
          <h2 className="text-xl font-semibold">My Orders</h2>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="mb-4">
            <CardContent className="p-4">
              <Skeleton className="mb-2 h-4 w-1/3" />
              <Skeleton className="mb-2 h-4 w-1/2" />
              <Skeleton className="h-4 w-1/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-6">
        <div className="mb-6 flex items-center gap-2">
          <Package className="h-5 w-5" />
          <h2 className="text-xl font-semibold">My Orders</h2>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={fetchOrders} className="min-h-[44px]">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          <h2 className="text-xl font-semibold">My Orders</h2>
          <Badge variant="secondary" className="ml-1">
            {orders.length}
          </Badge>
        </div>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Inbox className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium">No orders yet</p>
            <p className="text-sm text-muted-foreground">
              When you place orders, they will appear here.
            </p>
            <Button onClick={() => onNavigate("shop")} className="mt-2 min-h-[44px]">
              Start Shopping
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-4">
                {/* Order header */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-mono text-muted-foreground">
                      {order.orderNumber}
                    </span>
                    <Badge variant={STATUS_VARIANT[order.status] ?? "outline"}>
                      {STATUS_LABELS[order.status] ?? order.status}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatPrice(order.cartTotal)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* Order items */}
                <div className="space-y-1">
                  {order.orderItems?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-sm text-muted-foreground py-1"
                    >
                      <span>
                        {item.variantSnapshot?.productName ?? "Product"}
                        {item.variantSnapshot?.variantValue
                          ? ` — ${item.variantSnapshot.variantType ?? ""}: ${item.variantSnapshot.variantValue}`
                          : ""}
                        {" "}× {item.quantity}
                      </span>
                      <span>{formatPrice(item.unitPrice * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-[44px] min-w-[44px]"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-[44px] min-w-[44px]"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}