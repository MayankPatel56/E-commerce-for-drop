import { Metadata } from "next";
import { SignupPageClient } from "./signup-client";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://www.indicoreoriginals.me";

export const metadata: Metadata = {
  title: "Create Account — Indicore Originals",
  description: "Create your Indicore Originals account to access orders, wishlist, and profile.",
  openGraph: {
    title: "Create Account — Indicore Originals",
    description: "Create your Indicore Originals account.",
    url: `${SITE_URL}/signup`,
    siteName: "Indicore Originals",
    type: "website",
  },
};

export default function SignupPage() {
  return <SignupPageClient />;
}