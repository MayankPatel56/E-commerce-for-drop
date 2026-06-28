import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/homepage — Public homepage content
 * Returns the homepage_content singleton + featured products + categories + latest approved reviews
 * Plan Reference: Phase 9 ISR — revalidate = 300 (5 minutes)
 */
export const revalidate = 300;

export async function GET() {
  try {
    // 1. Get homepage content singleton
    const homepage = await db.homepageContent.findUnique({ where: { id: 1 } });
    if (!homepage) {
      return NextResponse.json({ error: "Homepage content not configured" }, { status: 404 });
    }

    // Parse JSON columns
    const heroBanner = homepage.heroBanner ?? null;
    const featuredProductIds: number[] = (homepage.featuredProductIds as number[] | null) ?? [];
    const categoriesSection = homepage.categoriesSection as Record<string, any> | null;
    const whyChooseUs = homepage.whyChooseUs ?? [];
    const customerReviews = (homepage.customerReviews as Record<string, any> | null) ?? { max_reviews_to_show: 6 };
    const footer = homepage.footer ?? null;

    // 2-5. Fetch featured products, categories, reviews, and settings in parallel —
    // none of these depend on each other's results, only on values already
    // derived from `homepage` above, so there's no reason to await them one at a time.
    const displayCategoryIds = categoriesSection?.display_categories || [];
    const maxReviews = customerReviews.max_reviews_to_show ?? 6;

    const [featuredProducts, categories, reviews, settings] = await Promise.all([
      // 2. Featured products (published only, with category)
      featuredProductIds.length > 0
        ? db.product.findMany({
            where: {
              id: { in: featuredProductIds },
              isPublished: true,
            },
            include: {
              category: { select: { name: true, slug: true } },
            },
            take: 10,
          })
        : Promise.resolve([]),

      // 3. Categories for categories section
      displayCategoryIds.length > 0
        ? db.category.findMany({
            where: { id: { in: displayCategoryIds } },
            include: {
              _count: {
                select: { products: { where: { isPublished: true } } },
              },
            },
          })
        : db.category.findMany({
            include: {
              _count: {
                select: { products: { where: { isPublished: true } } },
              },
            },
            orderBy: { name: "asc" },
          }),

      // 4. Latest approved reviews (count controlled by customer_reviews config)
            // 4. Latest approved reviews (count controlled by customer_reviews config)
      db.review.findMany({
        where: { status: "approved" },
        orderBy: { reviewedAt: "desc" },
        take: maxReviews,
        // ✅ YAHAN CHANGES KAREIN: `include` ki jagah `select` use karein aur `photoUrl` add karein
        select: {
          id: true,
          rating: true,
          title: true,
          comment: true,
          reviewedAt: true,
          photoUrl: true, // ✅ YEH LINE ADD KAREIN (Taki photo URL aaye!)
          displayName: true,
          customer: { select: { name: true } },
          product: { select: { name: true, slug: true } },
        },
      }),
      // 5. Settings for footer
      db.setting.findMany({
        where: {
          key: { in: ["store_name", "store_email", "store_phone", "social_links"] },
        },
      }),
    ]);

    const settingsMap: Record<string, unknown> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    return NextResponse.json({
      heroBanner,
      featuredProducts,
      categories,
      whyChooseUs,
      customerReviews,
      reviews,
      footer,
      settings: settingsMap,
    });
  } catch (error) {
    console.error("GET /api/homepage error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}