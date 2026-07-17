import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import HomePageClient from "../../HomePageClient";

export const revalidate = 60;

interface ProductMetadata {
  name: string;
  slug: string;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  primaryImage: string | null;
}

async function getSiteUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  if (!host) {
    return "http://localhost:3000";
  }

  return `${protocol}://${host}`;
}

async function toAbsoluteUrl(pathOrUrl: string | null | undefined) {
  if (!pathOrUrl) {
    return null;
  }

  try {
    return new URL(pathOrUrl, await getSiteUrl()).toString();
  } catch {
    return null;
  }
}

async function fetchProduct(slug: string): Promise<ProductMetadata | null> {
  const response = await fetch(`${await getSiteUrl()}/api/products/${slug}`, {
    next: { revalidate: 60 },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to load product metadata for ${slug}`);
  }

  return response.json();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) {
    return {
      title: "Product not found",
      description: "The requested product does not exist.",
    };
  }

  const title = product.seoTitle || product.name;
  const description =
    product.seoDescription ||
    product.description ||
    `View ${product.name} on Indicore Originals.`;
  const imageUrl = await toAbsoluteUrl(product.primaryImage);
  const canonicalUrl = `${await getSiteUrl()}/product/${product.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonicalUrl,
      images: imageUrl ? [{ url: imageUrl, alt: product.name }] : undefined,
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) {
    notFound();
  }

  return (
    <Suspense fallback={null}>
      <HomePageClient initialView="product" initialProductSlug={slug} />
    </Suspense>
  );
}