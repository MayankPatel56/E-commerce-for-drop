"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Phone,
  MapPin,
  Package,
  CheckCircle2,
  Truck,
  XCircle,
  RotateCcw,
  Loader2,
  MessageSquare,
  User,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface OrderDetailProps {
  orderId: number;
  onBack: () => void;
  onRefresh?: () => void;
}

type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "return_requested"
  | "returned"
  | "cancelled";

interface OrderCustomer {
  name: string;
  email: string;
  phone: string;
  isRegistered: boolean;
}

interface OrderItem {
  id: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  variantSnapshot: Record<string, unknown> | null;
  variant: {
    id: number;
    sku: string;
    variantType: string;
    variantValue: string;
    product: { name: string; slug: string; primaryImage: string | null };
  } | null;
}

interface ShippingAddress {
  name?: string;
  phone?: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

interface Order {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  cartTotal: number;
  createdAt: string;
  updatedAt: string;
  consentGiven: boolean;
  internalNotes: string | null;
  shippingAddress: ShippingAddress;
  customer: OrderCustomer;
  items: OrderItem[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatPrice(price: number): string {
  return `₹${price.toLocaleString("en-IN")}`;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("en-IN", { month: "short" });
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  } catch {
    return dateStr;
  }
}

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className:
      "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
  confirmed: {
    label: "Confirmed",
    className:
      "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-700 dark:bg-sky-950 dark:text-sky-300",
  },
  shipped: {
    label: "Shipped",
    className:
      "border-violet-300 bg-violet-50 text-violet-800 dark:border-violet-700 dark:bg-violet-950 dark:text-violet-300",
  },
  delivered: {
    label: "Delivered",
    className:
      "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  return_requested: {
    label: "Return Requested",
    className:
      "border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-700 dark:bg-orange-950 dark:text-orange-300",
  },
  returned: {
    label: "Returned",
    className:
      "border-stone-300 bg-stone-100 text-stone-700 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-300",
  },
  cancelled: {
    label: "Cancelled",
    className:
      "border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-300",
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function OrderDetail({
  orderId,
  onBack,
  onRefresh,
}: OrderDetailProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [codNotes, setCodNotes] = useState("");
  const [returnNotes, setReturnNotes] = useState("");
  const [internalNote, setInternalNote] = useState("");

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load order");
      }
      const data: Order = await res.json();
      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const refresh = useCallback(() => {
    onRefresh?.();
    fetchOrder();
  }, [onRefresh, fetchOrder]);

  /* --- Status transition helpers ------------------------------------ */

  const updateStatus = async (newStatus: OrderStatus) => {
    if (!order) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Status update failed");
      }
      toast.success(`Order status updated to ${STATUS_CONFIG[newStatus].label}`);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  const verifyCod = async () => {
    if (!order) return;
    setActionLoading(true);
    try {
      const body: { internalNotes?: string } = {};
      if (codNotes.trim()) body.internalNotes = codNotes.trim();
      const res = await fetch(`/api/admin/orders/${order.id}/verify-cod`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "COD verification failed");
      }
      toast.success("COD verified — order confirmed");
      setCodNotes("");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "COD verification failed");
    } finally {
      setActionLoading(false);
    }
  };

  const processReturn = async () => {
    if (!order) return;
    if (!returnNotes.trim()) {
      toast.error("Internal notes are required to process a return");
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internalNotes: returnNotes.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Return processing failed");
      }
      toast.success("Return processed successfully");
      setReturnNotes("");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to process return");
    } finally {
      setActionLoading(false);
    }
  };

  const saveInternalNote = async () => {
    if (!order) return;
    if (!internalNote.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: order.status,
          internalNotes: internalNote.trim(),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to save note");
      }
      toast.success("Internal note saved");
      setInternalNote("");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save note");
    } finally {
      setActionLoading(false);
    }
  };

  /* --- Render ------------------------------------------------------- */

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onBack={onBack} />;
  if (!order) return null;

  const statusCfg = STATUS_CONFIG[order.status];
  const addr = order.shippingAddress;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground min-h-[44px] min-w-[44px] justify-start"
      >
        <ArrowLeft className="size-4" />
        Back to Orders
      </button>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* ========== LEFT COLUMN ========== */}
        <div className="space-y-6">
          {/* Order header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-mono text-xl font-bold tracking-tight sm:text-2xl">
                {order.orderNumber}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDate(order.createdAt)}
              </p>
            </div>
            <Badge variant="outline" className={statusCfg.className}>
              {statusCfg.label}
            </Badge>
          </div>

          {/* Customer info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="size-4" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{order.customer.name}</p>
              <p className="text-muted-foreground">{order.customer.email}</p>
              <p className="text-muted-foreground">{order.customer.phone}</p>
              {order.customer.isRegistered && (
                <Badge variant="secondary" className="mt-1">
                  Registered
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Shipping address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="size-4" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-muted-foreground">
              {addr.name && (
                <p className="font-medium text-foreground">{addr.name}</p>
              )}
              {addr.addressLine1 && <p>{addr.addressLine1}</p>}
              {addr.addressLine2 && <p>{addr.addressLine2}</p>}
              {(addr.city || addr.state || addr.pincode) && (
                <p>
                  {[addr.city, addr.state, addr.pincode]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Order items table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="size-4" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Variant</TableHead>
                    <TableHead className="hidden sm:table-cell">SKU</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right hidden md:table-cell">
                      Unit Price
                    </TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {(item.variantSnapshot?.productName as string) ??
                          item.variant?.product?.name ??
                          "Unknown Product"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.variantSnapshot?.variantType
                          ? `${item.variantSnapshot.variantType as string}: ${item.variantSnapshot.variantValue as string}`
                          : item.variant
                            ? `${item.variant.variantType}: ${item.variant.variantValue}`
                            : "—"}
                      </TableCell>
                      <TableCell className="hidden font-mono text-xs sm:table-cell">
                        {item.variant?.sku ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right hidden md:table-cell">
                        {formatPrice(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPrice(item.lineTotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-right font-semibold"
                    >
                      Total
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatPrice(order.cartTotal)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>

          {/* Internal notes (read-only display) */}
          {order.internalNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="size-4" />
                  Internal Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {order.internalNotes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ========== RIGHT COLUMN — STICKY SIDEBAR ========== */}
        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          {/* Current status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge
                variant="outline"
                className={`${statusCfg.className} text-sm px-3 py-1`}
              >
                {statusCfg.label}
              </Badge>
            </CardContent>
          </Card>

          {/* COD Verification — pending */}
          {order.status === "pending" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">COD Verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Phone className="size-4" />
                  <AlertDescription>
                    Contact the customer via phone or WhatsApp to verify the
                    order.
                  </AlertDescription>
                </Alert>

                <div className="flex items-center gap-2">
                  <Phone className="size-4 text-muted-foreground" />
                  <a
                    href={`tel:${order.customer.phone}`}
                    className="text-sm font-medium underline-offset-4 hover:underline"
                  >
                    {order.customer.phone}
                  </a>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="cod-notes"
                    className="text-sm font-medium text-muted-foreground"
                  >
                    Notes (optional)
                  </label>
                  <Textarea
                    id="cod-notes"
                    placeholder="Add verification notes..."
                    value={codNotes}
                    onChange={(e) => setCodNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button
                  className="w-full min-h-[44px]"
                  onClick={verifyCod}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
                  Mark as Confirmed
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Status Update — confirmed / shipped / delivered */}
          {order.status !== "pending" &&
            order.status !== "cancelled" &&
            order.status !== "returned" &&
            order.status !== "return_requested" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Update Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {order.status === "confirmed" && (
                    <Button
                      className="w-full min-h-[44px]"
                      onClick={() => updateStatus("shipped")}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Truck className="size-4" />
                      )}
                      Mark as Shipped
                    </Button>
                  )}

                  {order.status === "shipped" && (
                    <Button
                      className="w-full min-h-[44px]"
                      onClick={() => updateStatus("delivered")}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="size-4" />
                      )}
                      Mark as Delivered
                    </Button>
                  )}

                  {order.status === "delivered" && (
                    <Button
                      variant="outline"
                      className="w-full min-h-[44px]"
                      onClick={() => updateStatus("return_requested")}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <RotateCcw className="size-4" />
                      )}
                      Request Return
                    </Button>
                  )}

                  <Separator />

                  <Button
                    variant="destructive"
                    className="w-full min-h-[44px]"
                    onClick={() => updateStatus("cancelled")}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <XCircle className="size-4" />
                    )}
                    Cancel Order
                  </Button>
                </CardContent>
              </Card>
            )}

          {/* Return Processing — return_requested */}
          {order.status === "return_requested" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Return Processing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="return-notes"
                    className="text-sm font-medium"
                  >
                    Internal notes <span className="text-destructive">*</span>
                  </label>
                  <Textarea
                    id="return-notes"
                    placeholder="Reason for return approval / notes..."
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button
                  className="w-full min-h-[44px]"
                  onClick={processReturn}
                  disabled={actionLoading || !returnNotes.trim()}
                >
                  {actionLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <RotateCcw className="size-4" />
                  )}
                  Process Return
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Internal Notes — always visible */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="size-4" />
                Add Note
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Add an internal note..."
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                rows={3}
              />
              <Button
                variant="outline"
                className="w-full min-h-[44px]"
                onClick={saveInternalNote}
                disabled={actionLoading || !internalNote.trim()}
              >
                {actionLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <MessageSquare className="size-4" />
                )}
                Save Note
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Loading Skeleton                                                   */
/* ------------------------------------------------------------------ */

function LoadingSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6">
      <Skeleton className="h-5 w-40" />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-6 w-24" />
          </div>

          {/* Customer skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-52" />
              <Skeleton className="h-4 w-36" />
            </CardContent>
          </Card>

          {/* Address skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-36" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>

          {/* Items table skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
              <Separator />
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-28" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar skeleton */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-28" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-36" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Error State                                                        */
/* ------------------------------------------------------------------ */

function ErrorState({
  message,
  onBack,
}: {
  message: string;
  onBack: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground min-h-[44px] min-w-[44px] justify-start"
      >
        <ArrowLeft className="size-4" />
        Back to Orders
      </button>

      <Alert variant="destructive">
        <XCircle className="size-4" />
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    </div>
  );
}