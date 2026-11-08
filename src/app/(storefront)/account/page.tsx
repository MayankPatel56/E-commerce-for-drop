import { Metadata } from "next";
import { CustomerDashboard } from "@/components/store/customer-dashboard";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://www.indicoreoriginals.me";

export const metadata: Metadata = {
  title: "My Account — Indicore Originals",
  description: "Manage your account, view orders, wishlist, and profile at Indicore Originals.",
  openGraph: {
    title: "My Account — Indicore Originals",
    description: "Manage your account, view orders, wishlist, and profile.",
    url: `${SITE_URL}/account`,
    siteName: "Indicore Originals",
    type: "website",
  },
};

export default async function AccountPage() {
  return <CustomerDashboard />;
}