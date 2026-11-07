"use client";

import { useTrackingInit } from "@/lib/tracking";

/**
 * Client component to initialize Meta Pixel and GA4 tracking
 * Renders nothing but runs initialization effects on mount
 */
export function TrackingInit(): null {
  useTrackingInit();
  return null;
}