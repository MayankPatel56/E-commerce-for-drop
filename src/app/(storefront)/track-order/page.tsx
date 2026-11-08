import { Metadata } from "next";
import { TrackOrderPage } from "@/components/store/track-order-page";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://www.indicoreoriginals.me";

export const metadata: Metadata = {
  title: "Track Your Order — Indicore Originals",
  description: "Track your order status and delivery updates. Enter your order number and email to get real-time tracking information.",
  openGraph: {
    title: "Track Your Order — Indicore Originals",
    description: "Track your order status and delivery updates.",
    url: `${SITE_URL}/track-order`,
    siteName: "Indicore Originals",
    type: "website",
  },
};

export default async function TrackOrderPageRoute() {
  return <TrackOrderPage />;
}