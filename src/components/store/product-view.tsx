import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import type { Product, ProductFeature, ProductBundleOffer } from "@/lib/product-types";

/**
 * Fetch a single published product by slug directly from Prisma.
 * This runs on the server — no client-side fetch needed.
 */
export async function fetchProduct(slug: string): Promise<Product | null> {
  const product = await db.product.findUnique({
    where: { slug },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      variants: {
        orderBy: [{ variantType: "asc" }, { variantValue: "asc" }],
      },
      productTags: {
        include: {
          tag: { select: { id: true, name: true } },
        },
      },
      reviews: {
        where: { status: "approved" },
        include: {
          customer: { select: { name: true } },
        },
        orderBy: { reviewedAt: "desc" },
      },
    },
  });

  if (!product || !product.isPublished) {
    return null;
  }

  const approvedReviews = product.reviews;
  const avgRating =
    approvedReviews.length > 0
      ? Math.round(
          (approvedReviews.reduce((sum, r) => sum + r.rating, 0) /
            approvedReviews.length) *
            10
        ) / 10
      : 0;

  const galleryImages: string[] = (product.galleryImages as string[] | null) ?? [];

  // Group variants by type for the UI selector
  const variantTypes: Record<
    string,
    {
      value: string;
      variantId: number;
      colorHex: string | null;
      price: number | null;
      stockQuantity: number;
      isOutOfStock: boolean;
    }[]
  > = {};
  for (const v of product.variants) {
    if (!variantTypes[v.variantType]) {
      variantTypes[v.variantType] = [];
    }
    variantTypes[v.variantType].push({
      value: v.variantValue,
      variantId: v.id,
      colorHex: v.colorHex,
      price: v.price,
      stockQuantity: v.stockQuantity,
      isOutOfStock: v.isOutOfStock,
    });
  }

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    badgeText: product.badgeText,
    soldLabel: product.soldLabel,
    videoUrl: product.videoUrl,
    features: (product.features as (ProductFeature | { icon: string; label: string })[] | null) ?? [],
    bundleOffers: (product.bundleOffers as ProductBundleOffer[] | null) ?? [],
    primaryImage: product.primaryImage,
    galleryImages,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    category: product.category,
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      variantType: v.variantType,
      variantValue: v.variantValue,
      colorHex: v.colorHex,
      price: v.price,
      stockQuantity: v.stockQuantity,
      isOutOfStock: v.isOutOfStock,
    })),
    variantTypes,
    tags: product.productTags.map((pt) => pt.tag),
    reviews: approvedReviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      photoUrl: r.photoUrl,
      reviewedAt: r.reviewedAt.toISOString(),
      customerName: r.customer?.name ?? r.displayName ?? "Anonymous",
    })),
    averageRating: avgRating,
    reviewCount: approvedReviews.length,
    createdAt: product.createdAt.toISOString(),
    inStock: product.variants.some(v => !v.isOutOfStock && v.stockQuantity > 0),
  };
}