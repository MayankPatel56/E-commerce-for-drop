"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useStoreNavigate } from "@/hooks/useStoreNavigate";
import { trackPurchase } from "@/lib/tracking";
import { CheckoutPage } from "./checkout-page";

interface OrderDetails {
  total: number;
  items: Array<{
    variantId: number;
    productName: string;
    quantity: number;
    price: number;
  }>;
}

/**
 * Client wrapper for the checkout page.
 *
 * - `onNavigate` is backed by `useStoreNavigate()` so the checkout page's
 *   "Back to Cart" / "Continue Shopping" buttons actually route to real pages.
 * - `onOrderSuccess(orderNumber, orderDetails)` fires the Purchase pixel event
 *   immediately (so the event always carries the order total and items) and
 *   then redirects to `/order-confirmation/[orderNumber]`.
 */
export function CheckoutPageWrapper() {
  const navigate = useStoreNavigate();
  const router = useRouter();

  const handleOrderSuccess = useCallback(
    (orderNumber: string, orderDetails: OrderDetails) => {
      if (orderDetails.total > 0 && orderDetails.items.length > 0) {
        const eventId = `purchase-${orderNumber}`;
        trackPurchase({
          content_ids: orderDetails.items.map((item) => String(item.variantId)),
          content_type: "product",
          content_name: orderDetails.items.map((item) => item.productName).join(", "),
          value: orderDetails.total,
          currency: "INR",
          num_items: orderDetails.items.reduce((sum, item) => sum + item.quantity, 0),
          event_id: eventId,
        });
      }
      router.push(`/order-confirmation/${orderNumber}`);
    },
    [router]
  );

  return (
    <CheckoutPage onOrderSuccess={handleOrderSuccess} onNavigate={navigate} />
  );
}