import { Metadata } from "next";
import { CompliancePageWrapper } from "@/components/store/compliance-page-wrapper";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://www.indicoreoriginals.me";

export const metadata: Metadata = {
  title: "Return & Refund Policy — Indicore Originals",
  description: "Our return and refund policy. 7-day return window, easy returns process, and refund details for COD and prepaid orders at Indicore Originals.",
  openGraph: {
    title: "Return & Refund Policy — Indicore Originals",
    description: "Our return and refund policy. 7-day return window, easy returns process.",
    url: `${SITE_URL}/returns`,
    siteName: "Indicore Originals",
    type: "website",
  },
};

export default async function ReturnsPageRoute() {
  return (
    <CompliancePageWrapper page="returns" />
  );
}