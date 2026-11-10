import { Metadata } from "next";
import { CheckoutPageWrapper } from "@/components/store/checkout-page-wrapper";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://www.indicoreoriginals.me";

export const metadata: Metadata = {
  title: "Checkout — Indicore Originals",
  description: "Complete your purchase securely. COD available, free delivery across India.",
  openGraph: {
    title: "Checkout — Indicore Originals",
    description: "Complete your purchase securely. COD available, free delivery across India.",
    url: `${SITE_URL}/checkout`,
    siteName: "Indicore Originals",
    type: "website",
  },
};

export default async function CheckoutPageRoute() {
  return <CheckoutPageWrapper />;
}