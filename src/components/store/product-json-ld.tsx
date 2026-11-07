import type { Product } from "@/lib/product-types";

interface ProductJsonLdProps {
  product: Product;
  siteUrl: string;
}

/**
 * JSON-LD Product schema for structured data / rich results.
 * Server component — rendered inline as a <script type="application/ld+json">.
 */
export function ProductJsonLd({ product, siteUrl }: ProductJsonLdProps) {
  const price = product.price;
  const availability = product.variants.some((v) => !v.isOutOfStock && v.stockQuantity > 0)
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";

  const images: string[] = [
    product.primaryImage ?? "",
    ...product.galleryImages,
  ].filter(Boolean) as string[];

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: images.length > 0 ? images : [`${siteUrl}/loko.png`],
    description:
      product.seoDescription ||
      product.description ||
      `Shop ${product.name} at Indicore Originals.`,
    sku: product.variants[0]?.sku ?? String(product.id),
    mpn: String(product.id),
    brand: {
      "@type": "Brand",
      name: "Indicore Originals",
    },
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/shop/products/${product.slug}`,
      priceCurrency: "INR",
      price: price.toFixed(2),
      availability,
      seller: {
        "@type": "Organization",
        name: "Indicore Originals",
      },
    },
  };

  if (product.reviewCount > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.averageRating.toFixed(1),
      reviewCount: product.reviewCount,
      bestRating: "5",
      worstRating: "1",
    };
  }

  if (product.category) {
    jsonLd.category = product.category.name;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      suppressHydrationWarning
    />
  );
}