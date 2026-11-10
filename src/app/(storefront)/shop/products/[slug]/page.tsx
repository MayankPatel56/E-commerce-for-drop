import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { fetchProduct } from "@/components/store/product-view";
import { ProductInteractiveView } from "@/components/store/product-interactive-view";
import { ProductDetailSkeleton } from "@/components/store/product-detail";
import { ProductJsonLd } from "@/components/store/product-json-ld";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://www.indicoreoriginals.me";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

// Force dynamic rendering so build doesn't require DB connection
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  let product: Awaited<ReturnType<typeof fetchProduct>> = null;
  try {
    product = await fetchProduct(slug);
  } catch {
    // DB not available at build time
  }

  if (!product) {
    return {
      title: "Product Not Found — Indicore Originals",
      description: "The product you are looking for does not exist or has been removed.",
    };
  }

  const title = product.seoTitle
    ? `${product.seoTitle} — Indicore Originals`
    : `${product.name} — Indicore Originals`;

  const description =
    product.seoDescription ||
    product.description ||
    `Shop ${product.name} at Indicore Originals. COD available, free delivery.`;

  const ogImage = product.primaryImage
    ? product.primaryImage.startsWith("http")
      ? product.primaryImage
      : `${SITE_URL}${product.primaryImage}`
    : `${SITE_URL}/loko.png`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/shop/products/${product.slug}`,
      siteName: "Indicore Originals",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 1200,
          alt: product.name,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  let product: Awaited<ReturnType<typeof fetchProduct>> = null;
  try {
    product = await fetchProduct(slug);
  } catch {
    // DB not available at build time
  }

  if (!product) {
    notFound();
  }

  // Product is guaranteed to exist here since we checked above
  const safeProduct = product as NonNullable<typeof product>;

  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductJsonLd product={safeProduct} siteUrl={SITE_URL} />
      <ProductInteractiveView product={safeProduct} />
    </Suspense>
  );
}