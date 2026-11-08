import { Metadata } from "next";
import { LoginPageClient } from "./login-client";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://www.indicoreoriginals.me";

export const metadata: Metadata = {
  title: "Sign In — Indicore Originals",
  description: "Sign in to your Indicore Originals account to access orders, wishlist, and profile.",
  openGraph: {
    title: "Sign In — Indicore Originals",
    description: "Sign in to your Indicore Originals account.",
    url: `${SITE_URL}/login`,
    siteName: "Indicore Originals",
    type: "website",
  },
};

export default function LoginPage() {
  return <LoginPageClient />;
}