import { Metadata } from "next";
import { CustomerOrders } from "@/components/store/customer-orders";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://www.indicoreoriginals.me";

export const metadata: Metadata = {
  title: "My Orders — My Account — Indicore Originals",
  description: "View your order history and track shipments at Indicore Originals.",
  openGraph: {
    title: "My Orders — My Account — Indicore Originals",
    description: "View your order history and track shipments.",
    url: `${SITE_URL}/account/orders`,
    siteName: "Indicore Originals",
    type: "website",
  },
};

export default async function OrdersPage() {
  return <CustomerOrders />;
}