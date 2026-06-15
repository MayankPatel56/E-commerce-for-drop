"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ShoppingBag, Package, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// ── Types ──────────────────────────────────────────────────────────────────

interface OrderConfirmationProps {
  orderNumber: string;
  onNavigate: (view: string, data?: Record<string, unknown>) => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export function OrderConfirmation({
  orderNumber,
  onNavigate,
}: OrderConfirmationProps) {
  const [visible, setVisible] = useState(false);

  // Subtle entrance animation
  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div
        className={`transition-all duration-500 ease-out ${
          visible
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0"
        }`}
      >
        <Card className="gap-0 overflow-hidden rounded-xl border shadow-sm">
          <CardContent className="flex flex-col items-center gap-6 p-6 pt-8 sm:p-8 sm:pt-10">
            {/* Success icon */}
            <div className="flex size-20 items-center justify-center rounded-full bg-green-100 ring-4 ring-green-100/50 sm:size-24">
              <CheckCircle2 className="size-10 text-green-600 sm:size-12" />
            </div>

            {/* Heading */}
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight">
                Order Placed Successfully!
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Thank you for your purchase
              </p>
            </div>

            {/* Order number — code-style display */}
            <div className="w-full rounded-md bg-muted px-4 py-3">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Order Number
              </p>
              <p className="break-all font-mono text-sm font-semibold sm:text-base">
                {orderNumber}
              </p>
            </div>

            {/* Payment method */}
            <div className="flex w-full items-center gap-3 rounded-md border bg-background px-4 py-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Package className="size-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Payment Method
                </p>
                <p className="text-sm font-medium">
                  Cash on Delivery (COD)
                </p>
              </div>
            </div>

            {/* Info message */}
            <div className="text-center">
              <p className="text-sm leading-relaxed text-muted-foreground">
                We will contact you on phone to confirm your order. Please keep
                your order number handy for tracking.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex w-full flex-col gap-3">
              <Button
                className="min-h-[44px] w-full"
                onClick={() => onNavigate("shop")}
              >
                <ShoppingBag className="size-4" />
                Continue Shopping
              </Button>

              <Button
                variant="outline"
                className="min-h-[44px] w-full"
                onClick={() => onNavigate("track-order")}
              >
                Track Your Order
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
