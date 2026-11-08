import { Metadata } from "next";
import { CustomerReviews } from "@/components/store/customer-reviews";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://www.indicoreoriginals.me";

export const metadata: Metadata = {
  title: "My Reviews — My Account — Indicore Originals",
  description: "View and manage your product reviews at Indicore Originals.",
  openGraph: {
    title: "My Reviews — My Account — Indicore Originals",
    description: "View and manage your product reviews.",
    url: `${SITE_URL}/account/reviews`,
    siteName: "Indicore Originals",
    type: "website",
  },
};

export default async function ReviewsPage() {
  return <CustomerReviews />;
}