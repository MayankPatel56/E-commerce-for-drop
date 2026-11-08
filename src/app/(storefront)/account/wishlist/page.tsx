import { Metadata } from "next";
import { CustomerWishlist } from "@/components/store/customer-wishlist";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://www.indicoreoriginals.me";

export const metadata: Metadata = {
  title: "Wishlist — My Account — Indicore Originals",
  description: "View and manage your wishlist at Indicore Originals.",
  openGraph: {
    title: "Wishlist — My Account — Indicore Originals",
    description: "View and manage your wishlist.",
    url: `${SITE_URL}/account/wishlist`,
    siteName: "Indicore Originals",
    type: "website",
  },
};

export default async function WishlistPage() {
  return <CustomerWishlist />;
}