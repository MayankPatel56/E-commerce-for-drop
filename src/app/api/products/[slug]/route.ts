import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/products/[slug] — Public product detail
 * Returns full product info: variants, gallery, approved reviews, SEO, avg rating
 * Plan Reference: Phase 9 ISR — revalidate = 60 (1 minute)
 */
export const revalidate = 60;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

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

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (!product.isPublished) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Calculate average rating
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
    const variantTypes: Record<string, { value: string; variantId: number; price: number | null; stockQuantity: number; isOutOfStock: boolean }[]> = {};
    for (const v of product.variants) {
      if (!variantTypes[v.variantType]) {
        variantTypes[v.variantType] = [];
      }
      variantTypes[v.variantType].push({
        value: v.variantValue,
        variantId: v.id,
        price: v.price,
        stockQuantity: v.stockQuantity,
        isOutOfStock: v.isOutOfStock,
      });
    }

    return NextResponse.json({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
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
        reviewedAt: r.reviewedAt,
        customerName: r.customer.name,
      })),
      averageRating: avgRating,
      reviewCount: approvedReviews.length,
      createdAt: product.createdAt,
    });
  } catch (error) {
    console.error("GET /api/products/[slug] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}