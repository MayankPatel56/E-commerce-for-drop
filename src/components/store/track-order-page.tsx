"use client";

import React, { useState, useCallback } from "react";
import {
  Search,
  Package,
  Clock,
  MapPin,
  Loader2,
  AlertCircle,
  FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// ─── Types ──────────────────────────────────────────────────────────────────

interface TrackOrderPageProps {
  onNavigate: (view: string, data?: Record<string, unknown>) => void;
}

interface OrderItem {
  variantSnapshot: {
    name?: string;
    type?: string;
    value?: string;
    [key: string]: unknown;
  } | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface TrackedOrder {
  orderNumber: string;
  status: string;
  cartTotal: number;
  createdAt: string;
  updatedAt: string;
  shippingAddress: Record<string, string>;
  items: OrderItem[];
}

interface HistoryOrder {
  orderNumber: string;
  status: string;
  cartTotal: number;
  createdAt: string;
  itemCount: number;
}

type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "return_requested"
  | "returned";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  return `₹${price.toLocaleString("en-IN")}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusColor(status: string): string {
  const map: Record<OrderStatus, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    confirmed: "bg-blue-100 text-blue-800 border-blue-200",
    shipped: "bg-orange-100 text-orange-800 border-orange-200",
    delivered: "bg-green-100 text-green-800 border-green-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
    return_requested: "bg-amber-100 text-amber-800 border-amber-200",
    returned: "bg-gray-100 text-gray-800 border-gray-200",
  };
  return (
    map[status as OrderStatus] ??
    "bg-muted text-muted-foreground border-border"
  );
}

function formatStatusLabel(status: string): string {
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── Component ──────────────────────────────────────────────────────────────

export function TrackOrderPage({ onNavigate }: TrackOrderPageProps) {
  // ── Shared state ────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<string>("track");

  // ── Track Order state ──────────────────────────────────────────────────
  const [trackOrderNumber, setTrackOrderNumber] = useState("");
  const [trackEmail, setTrackEmail] = useState("");
  const [trackErrors, setTrackErrors] = useState<Record<string, string>>({});
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [trackResult, setTrackResult] = useState<TrackedOrder | null>(null);

  // ── Order History state ────────────────────────────────────────────────
  const [historyEmail, setHistoryEmail] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyOrders, setHistoryOrders] = useState<HistoryOrder[]>([]);
  const [historySearched, setHistorySearched] = useState(false);

  // ── Track Order handlers ──────────────────────────────────────────────

  const handleTrack = useCallback(async () => {
    const newErrors: Record<string, string> = {};
    if (!trackOrderNumber.trim()) {
      newErrors.orderNumber = "Order number is required";
    }
    if (!trackEmail.trim()) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(trackEmail.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    setTrackErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setTrackLoading(true);
    setTrackError(null);
    setTrackResult(null);

    try {
      const res = await fetch(
        `/api/orders/track?orderNumber=${encodeURIComponent(trackOrderNumber.trim())}&email=${encodeURIComponent(trackEmail.trim())}`
      );

      if (res.status === 429) {
        const data = await res.json();
        setTrackError(
          data.error ??
            "Too many tracking attempts. Please try again in 15 minutes."
        );
      } else if (res.status === 404) {
        setTrackError(
          "Order not found. Please check your order number and email."
        );
      } else if (!res.ok) {
        const data = await res.json().catch(() => null);
        setTrackError(data?.error ?? "Something went wrong. Please try again.");
      } else {
        const data = await res.json();
        setTrackResult(data as TrackedOrder);
      }
    } catch {
      setTrackError("Network error. Please check your connection and try again.");
    } finally {
      setTrackLoading(false);
    }
  }, [trackOrderNumber, trackEmail]);

  const handleTrackKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleTrack();
      }
    },
    [handleTrack]
  );

  // ── Order History handlers ─────────────────────────────────────────────

  const handleHistorySearch = useCallback(async () => {
    const email = historyEmail.trim();
    if (!email) {
      setHistoryError("Email is required");
      return;
    }
    if (!isValidEmail(email)) {
      setHistoryError("Please enter a valid email address");
      return;
    }

    setHistoryLoading(true);
    setHistoryError(null);
    setHistoryOrders([]);
    setHistorySearched(true);

    try {
      const res = await fetch(
        `/api/orders/guest-history?email=${encodeURIComponent(email)}`
      );

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setHistoryError(
          data?.error ?? "Something went wrong. Please try again."
        );
      } else {
        const data = await res.json();
        setHistoryOrders((data.orders ?? []) as HistoryOrder[]);
      }
    } catch {
      setHistoryError(
        "Network error. Please check your connection and try again."
      );
    } finally {
      setHistoryLoading(false);
    }
  }, [historyEmail]);

  const handleHistoryKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleHistorySearch();
      }
    },
    [handleHistorySearch]
  );

  // Click on a history order card → switch to Track tab with prefilled data
  const handleSelectHistoryOrder = useCallback(
    (orderNumber: string, email: string) => {
      setTrackOrderNumber(orderNumber);
      setTrackEmail(email);
      setTrackErrors({});
      setTrackError(null);
      setTrackResult(null);
      setActiveTab("track");
    },
    []
  );

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      {/* Page heading */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10">
          <Package className="size-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Track Your Order</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your order details to check the status
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mx-auto grid w-full grid-cols-2">
          <TabsTrigger value="track" className="min-h-[44px] gap-1.5">
            <Search className="size-4" />
            Track Order
          </TabsTrigger>
          <TabsTrigger value="history" className="min-h-[44px] gap-1.5">
            <FileText className="size-4" />
            Order History
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Track Order ──────────────────────────────────────── */}
        <TabsContent value="track" className="mt-6">
          <Card className="gap-0 overflow-hidden rounded-xl border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Form fields — side by side on desktop, stacked on mobile */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Order Number */}
                <div className="space-y-2">
                  <Label htmlFor="track-order-number">Order Number</Label>
                  <Input
                    id="track-order-number"
                    placeholder="ORD-XXXXXXXXX-XXXXXX"
                    value={trackOrderNumber}
                    onChange={(e) => {
                      setTrackOrderNumber(e.target.value);
                      if (trackErrors.orderNumber) {
                        setTrackErrors((prev) => {
                          const next = { ...prev };
                          delete next.orderNumber;
                          return next;
                        });
                      }
                    }}
                    onKeyDown={handleTrackKeyDown}
                    aria-invalid={!!trackErrors.orderNumber}
                    className="min-h-[44px]"
                  />
                  {trackErrors.orderNumber && (
                    <p className="text-xs text-destructive">
                      {trackErrors.orderNumber}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="track-email">Email</Label>
                  <Input
                    id="track-email"
                    type="email"
                    placeholder="you@example.com"
                    value={trackEmail}
                    onChange={(e) => {
                      setTrackEmail(e.target.value);
                      if (trackErrors.email) {
                        setTrackErrors((prev) => {
                          const next = { ...prev };
                          delete next.email;
                          return next;
                        });
                      }
                    }}
                    onKeyDown={handleTrackKeyDown}
                    aria-invalid={!!trackErrors.email}
                    className="min-h-[44px]"
                  />
                  {trackErrors.email && (
                    <p className="text-xs text-destructive">
                      {trackErrors.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Submit */}
              <Button
                className="min-h-[44px] w-full"
                onClick={handleTrack}
                disabled={trackLoading}
              >
                {trackLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Tracking…
                  </>
                ) : (
                  <>
                    <Search className="size-4" />
                    Track
                  </>
                )}
              </Button>

              {/* Rate limit / not found alert */}
              {trackError && (
                <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertTitle>Oops!</AlertTitle>
                  <AlertDescription>{trackError}</AlertDescription>
                </Alert>
              )}

              {/* Loading skeleton */}
              {trackLoading && (
                <div className="space-y-4 pt-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Separator className="my-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              )}

              {/* Tracking result */}
              {trackResult && (
                <div className="space-y-4 pt-2">
                  <Separator />

                  {/* Order Number */}
                  <div className="rounded-md bg-muted px-4 py-3">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Order Number
                    </p>
                    <p className="break-all font-mono text-sm font-semibold">
                      {trackResult.orderNumber}
                    </p>
                  </div>

                  {/* Status + Date row */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Badge
                      variant="outline"
                      className={`text-xs font-medium ${getStatusColor(trackResult.status)}`}
                    >
                      {formatStatusLabel(trackResult.status)}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="size-3.5" />
                      {formatDate(trackResult.createdAt)}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="text-lg font-bold">
                      {formatPrice(trackResult.cartTotal)}
                    </span>
                  </div>

                  <Separator />

                  {/* Shipping Address */}
                  {trackResult.shippingAddress && (
                    <div>
                      <div className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                        <MapPin className="size-3.5 text-muted-foreground" />
                        Shipping Address
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {[
                          trackResult.shippingAddress.name,
                          trackResult.shippingAddress.street,
                          trackResult.shippingAddress.city,
                          trackResult.shippingAddress.state,
                          trackResult.shippingAddress.pincode,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  )}

                  <Separator />

                  {/* Items */}
                  <div>
                    <p className="mb-3 text-sm font-medium">Items</p>
                    <div className="space-y-3">
                      {trackResult.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start justify-between gap-3 rounded-lg border p-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">
                              {item.variantSnapshot?.name ?? "Item"}
                            </p>
                            {item.variantSnapshot?.type &&
                              item.variantSnapshot?.value && (
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {item.variantSnapshot.type}:{" "}
                                  {item.variantSnapshot.value}
                                </p>
                              )}
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-medium">
                              {formatPrice(item.lineTotal)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantity} × {formatPrice(item.unitPrice)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 2: Order History ──────────────────────────────────────── */}
        <TabsContent value="history" className="mt-6">
          <Card className="gap-0 overflow-hidden rounded-xl border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Find Your Orders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Email input */}
              <div className="space-y-2">
                <Label htmlFor="history-email">Email Address</Label>
                <Input
                  id="history-email"
                  type="email"
                  placeholder="you@example.com"
                  value={historyEmail}
                  onChange={(e) => setHistoryEmail(e.target.value)}
                  onKeyDown={handleHistoryKeyDown}
                  className="min-h-[44px]"
                />
                {historyError && (
                  <p className="text-xs text-destructive">{historyError}</p>
                )}
              </div>

              {/* Search */}
              <Button
                className="min-h-[44px] w-full"
                onClick={handleHistorySearch}
                disabled={historyLoading}
              >
                {historyLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Searching…
                  </>
                ) : (
                  <>
                    <Search className="size-4" />
                    Search
                  </>
                )}
              </Button>

              {/* Loading skeleton */}
              {historyLoading && (
                <div className="space-y-3 pt-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-lg border p-4 space-y-2"
                    >
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                  ))}
                </div>
              )}

              {/* Results */}
              {!historyLoading && historySearched && (
                <>
                  {historyOrders.length === 0 ? (
                    <div className="py-8 text-center">
                      <Package className="mx-auto mb-3 size-10 text-muted-foreground/50" />
                      <p className="text-sm font-medium text-muted-foreground">
                        No orders found
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        We couldn&apos;t find any orders associated with this
                        email address.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-muted-foreground">
                        {historyOrders.length} order
                        {historyOrders.length !== 1 ? "s" : ""} found
                      </p>
                      {historyOrders.map((order) => (
                        <button
                          key={order.orderNumber}
                          type="button"
                          onClick={() =>
                            handleSelectHistoryOrder(
                              order.orderNumber,
                              historyEmail.trim()
                            )
                          }
                          className="w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          {/* Top row: Order number + Status */}
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <p className="break-all font-mono text-xs font-semibold">
                              {order.orderNumber}
                            </p>
                            <Badge
                              variant="outline"
                              className={`shrink-0 text-xs ${getStatusColor(order.status)}`}
                            >
                              {formatStatusLabel(order.status)}
                            </Badge>
                          </div>

                          {/* Bottom row: Date + Total + Item count */}
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="size-3" />
                              {formatDate(order.createdAt)}
                            </span>
                            <span className="font-medium text-foreground">
                              {formatPrice(order.cartTotal)}
                            </span>
                            <span>
                              {order.itemCount} item
                              {order.itemCount !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
