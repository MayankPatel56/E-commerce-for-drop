"use client";

import { useStoreNavigate } from "@/hooks/useStoreNavigate";
import { OrderConfirmation } from "./order-confirmation";

/**
 * Client wrapper for the order confirmation page.
 * Provides a real `onNavigate` callback so the "Continue Shopping"
 * and "Track Your Order" buttons actually route to real pages.
 */
export function OrderConfirmationWrapper({
  orderNumber,
}: {
  orderNumber: string;
}) {
  const navigate = useStoreNavigate();

  return <OrderConfirmation orderNumber={orderNumber} onNavigate={navigate} />;
}