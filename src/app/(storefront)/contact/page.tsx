import { Metadata } from "next";
import { CompliancePageWrapper } from "@/components/store/compliance-page-wrapper";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://www.indicoreoriginals.me";

export const metadata: Metadata = {
  title: "Contact Us — Indicore Originals",
  description: "Get in touch with Indicore Originals. We'd love to hear from you - whether you have a question about our products, need help with an order, or just want to say hello.",
  openGraph: {
    title: "Contact Us — Indicore Originals",
    description: "Get in touch with Indicore Originals.",
    url: `${SITE_URL}/contact`,
    siteName: "Indicore Originals",
    type: "website",
  },
};

export default async function ContactPageRoute() {
  return (
    <CompliancePageWrapper page="contact" />
  );
}