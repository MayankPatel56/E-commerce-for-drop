import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { CartProvider } from "@/context/cart-context";

console.log("ENV CHECK:", {
  DATABASE_URL: !!process.env.DATABASE_URL,
  DIRECT_URL: !!process.env.DIRECT_URL,
  NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
  SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Indicore Originals — The Unique Products",
  description:
    "Shop curated products from Indicore Originals. Modern, mobile-first e-commerce platform with COD payment.",
  icons: {
    icon: "/loko.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <CartProvider>
          {children}
          <Toaster position="top-right" richColors />
        </CartProvider>
      </body>
    </html>
  );
}