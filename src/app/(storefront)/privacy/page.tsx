import { Metadata } from "next";
import { CompliancePageWrapper } from "@/components/store/compliance-page-wrapper";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://www.indicoreoriginals.me";

export const metadata: Metadata = {
  title: "Privacy Policy — Indicore Originals",
  description: "Our privacy policy explains how we collect, use, and protect your personal information in compliance with the DPDP Act 2023.",
  openGraph: {
    title: "Privacy Policy — Indicore Originals",
    description: "Our privacy policy explains how we collect, use, and protect your personal information.",
    url: `${SITE_URL}/privacy`,
    siteName: "Indicore Originals",
    type: "website",
  },
};

export default async function PrivacyPageRoute() {
  return (
    <CompliancePageWrapper page="privacy" />
  );
}