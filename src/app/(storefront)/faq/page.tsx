import { Metadata } from "next";
import { FaqPage } from "@/components/store/compliance-pages";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://www.indicoreoriginals.me";

export const metadata: Metadata = {
  title: "FAQ — Indicore Originals",
  description: "Find answers to commonly asked questions about our products, orders, shipping, returns, and more at Indicore Originals.",
  openGraph: {
    title: "FAQ — Indicore Originals",
    description: "Find answers to commonly asked questions about our products, orders, shipping, and more.",
    url: `${SITE_URL}/faq`,
    siteName: "Indicore Originals",
    type: "website",
  },
};

export default async function FaqPageRoute() {
  return <FaqPage />;
}