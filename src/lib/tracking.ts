/**
 * Client-side tracking utilities for Meta Pixel and GA4
 * Uses environment variables for Pixel ID and Measurement ID
 */

"use client";

import { useEffect } from "react";

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

// Initialize Meta Pixel (fbq)
export function initMetaPixel(): void {
  if (typeof window === "undefined" || !META_PIXEL_ID) return;

  // Prevent double initialization
  if ((window as any).fbqLoaded) return;
  (window as any).fbqLoaded = true;

  const fbq = (window as any).fbq || function () {
    (fbq as any).callMethod ? (fbq as any).callMethod.apply(fbq, arguments) : (fbq as any).queue.push(arguments);
  };

  if (!(window as any).fbq) {
    (window as any).fbq = fbq;
    (fbq as any).push = fbq;
    (fbq as any).loaded = true;
    (fbq as any).version = "2.0";
    (fbq as any).queue = [];
  }

  (fbq as any)("init", META_PIXEL_ID);
  (fbq as any)("track", "PageView");

  // Load the Pixel script
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  script.onload = () => {
    console.log("[Meta Pixel] Loaded");
  };
  script.onerror = () => {
    console.error("[Meta Pixel] Failed to load");
  };
  document.head.appendChild(script);
}

// Initialize GA4 (gtag)
export function initGA4(): void {
  if (typeof window === "undefined" || !GA4_MEASUREMENT_ID) return;

  // Prevent double initialization
  if ((window as any).gtagLoaded) return;
  (window as any).gtagLoaded = true;

  const gtag = (window as any).gtag || function () {
    (gtag as any).queue.push(arguments);
  };

  if (!(window as any).gtag) {
    (window as any).gtag = gtag;
    (gtag as any).queue = [];
  }

  (gtag as any)("js", new Date());
  (gtag as any)("config", GA4_MEASUREMENT_ID);

  // Load the gtag script
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
  script.onload = () => {
    console.log("[GA4] Loaded");
  };
  script.onerror = () => {
    console.error("[GA4] Failed to load");
  };
  document.head.appendChild(script);
}

// Type definitions for event parameters
interface MetaPixelEventParams {
  content_ids?: string[];
  content_type?: "product" | "product_group";
  content_name?: string;
  content_category?: string;
  value?: number;
  currency?: string;
  num_items?: number;
  predicted_ltv?: number;
  custom_data?: Record<string, any>;
}

interface GA4EventParams {
  items?: Array<{
    item_id: string;
    item_name: string;
    affiliation?: string;
    coupon?: string;
    currency?: string;
    discount?: number;
    index?: number;
    item_brand?: string;
    item_category?: string;
    item_category2?: string;
    item_category3?: string;
    item_category4?: string;
    item_category5?: string;
    item_list_id?: string;
    item_list_name?: string;
    item_variant?: string;
    location_id?: string;
    price?: number;
    quantity?: number;
  }>;
  value?: number;
  currency?: string;
  transaction_id?: string;
  coupon?: string;
  shipping?: number;
  tax?: number;
}

// Meta Pixel events
export function trackMetaPixel(eventName: string, params?: MetaPixelEventParams, eventId?: string): void {
  if (typeof window === "undefined" || !META_PIXEL_ID) return;
  const fbq = (window as any).fbq;
  if (fbq) {
    fbq("track", eventName, params, { eventID: eventId });
    console.log(`[Meta Pixel] ${eventName}`, params, eventId ? `{ eventID: ${eventId} }` : "");
  }
}

export function trackMetaPixelCustom(eventName: string, params?: Record<string, any>): void {
  if (typeof window === "undefined" || !META_PIXEL_ID) return;
  const fbq = (window as any).fbq;
  if (fbq) {
    fbq("trackCustom", eventName, params);
    console.log(`[Meta Pixel] Custom ${eventName}`, params);
  }
}

// GA4 events
export function trackGA4(eventName: string, params?: GA4EventParams): void {
  if (typeof window === "undefined" || !GA4_MEASUREMENT_ID) return;
  const gtag = (window as any).gtag;
  if (gtag) {
    gtag("event", eventName, params);
    console.log(`[GA4] ${eventName}`, params);
  }
}

// Pre-defined e-commerce events
export function trackViewContent(params: MetaPixelEventParams & { event_id?: string }): void {
  const { event_id, ...rest } = params;
  trackMetaPixel("ViewContent", rest, event_id);
  trackGA4("view_item", {
    currency: rest.currency || "INR",
    value: rest.value,
    items: rest.content_ids?.map((id, idx) => ({
      item_id: id,
      item_name: rest.content_name || "",
      item_category: rest.content_category,
      price: rest.value,
      quantity: 1,
    })),
  });
}

export function trackAddToCart(params: MetaPixelEventParams & { event_id?: string }): void {
  const { event_id, ...rest } = params;
  trackMetaPixel("AddToCart", rest, event_id);
  trackGA4("add_to_cart", {
    currency: rest.currency || "INR",
    value: rest.value,
    items: rest.content_ids?.map((id, idx) => ({
      item_id: id,
      item_name: rest.content_name || "",
      item_category: rest.content_category,
      price: rest.value,
      quantity: rest.num_items || 1,
    })),
  });
}

export function trackInitiateCheckout(params: MetaPixelEventParams & { event_id?: string }): void {
  const { event_id, ...rest } = params;
  trackMetaPixel("InitiateCheckout", rest, event_id);
  trackGA4("begin_checkout", {
    currency: rest.currency || "INR",
    value: rest.value,
    items: rest.content_ids?.map((id, idx) => ({
      item_id: id,
      item_name: rest.content_name || "",
      item_category: rest.content_category,
      price: rest.value,
      quantity: rest.num_items || 1,
    })),
  });
}

export function trackPurchase(params: MetaPixelEventParams & { event_id?: string }): void {
  const { event_id, ...rest } = params;
  trackMetaPixel("Purchase", rest, event_id);
  trackGA4("purchase", {
    currency: rest.currency || "INR",
    value: rest.value,
    transaction_id: rest.content_ids?.[0],
    items: rest.content_ids?.map((id, idx) => ({
      item_id: id,
      item_name: rest.content_name || "",
      item_category: rest.content_category,
      price: rest.value,
      quantity: rest.num_items || 1,
    })),
  });
}

// Hook for automatic initialization on app load
export function useTrackingInit(): void {
  useEffect(() => {
    initMetaPixel();
    initGA4();
  }, []);
}