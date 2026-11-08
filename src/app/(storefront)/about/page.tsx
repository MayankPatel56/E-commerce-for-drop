import { Metadata } from "next";
import { AboutPage } from "@/components/store/compliance-pages";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://www.indicoreoriginals.me";

export const metadata: Metadata = {
  title: "About Us — Indicore Originals",
  description: "Learn about Indicore Originals - our story, mission, and values. We curate original, thoughtfully crafted products at honest prices.",
  openGraph: {
    title: "About Us — Indicore Originals",
    description: "Learn about Indicore Originals - our story, mission, and values.",
    url: `${SITE_URL}/about`,
    siteName: "Indicore Originals",
    type: "website",
  },
};

export default async function AboutPageRoute() {
  return <AboutPage />;
}