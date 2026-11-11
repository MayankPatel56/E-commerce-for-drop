import { Metadata } from "next";
import { CompliancePageWrapper } from "@/components/store/compliance-page-wrapper";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://www.indicoreoriginals.me";

export const metadata: Metadata = {
  title: "Terms & Conditions — Indicore Originals",
  description: "Our terms and conditions for using the Indicore Originals website and purchasing our products. Please read carefully before placing an order.",
  openGraph: {
    title: "Terms & Conditions — Indicore Originals",
    description: "Our terms and conditions for using the Indicore Originals website and purchasing our products.",
    url: `${SITE_URL}/terms`,
    siteName: "Indicore Originals",
    type: "website",
  },
};

export default async function TermsPageRoute() {
  return (
    <CompliancePageWrapper page="terms" />
  );
}