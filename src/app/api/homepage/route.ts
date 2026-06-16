import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/homepage — Public homepage content
 * Returns the homepage_content singleton + featured products + categories + latest approved reviews
 */
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
    const categoriesSection = homepage.categoriesSection ?? null;
    const whyChooseUs = homepage.whyChooseUs ?? [];
    const customerReviews = homepage.customerReviews ?? { max_reviews_to_show: 6 };
    const footer = homepage.footer ?? null;

    // 2. Fetch featured products (published only, with category)
    const featuredProducts = featuredProductIds.length > 0
      ? await db.product.findMany({
          where: {
            id: { in: featuredProductIds },
            isPublished: true,
          },
          include: {
            category: { select: { name: true, slug: true } },
          },
          take: 10,
        })
      : [];

    // 3. Fetch categories for categories section
    const displayCategoryIds = categoriesSection?.display_categories || [];
    const categories = displayCategoryIds.length > 0
      ? await db.category.findMany({
          where: { id: { in: displayCategoryIds } },
          include: {
            _count: {
              select: { products: { where: { isPublished: true } } },
            },
          },
        })
      : await db.category.findMany({
          include: {
            _count: {
              select: { products: { where: { isPublished: true } } },
            },
          },
          orderBy: { name: "asc" },
        });

    // 4. Fetch latest approved reviews (count controlled by customer_reviews config)
    const maxReviews = customerReviews.max_reviews_to_show ?? 6;
    const reviews = await db.review.findMany({
      where: { status: "approved" },
      orderBy: { reviewedAt: "desc" },
      take: maxReviews,
      include: {
        customer: { select: { name: true } },
        product: { select: { name: true, slug: true } },
      },
    });

    // 5. Fetch settings for footer
    const settings = await db.setting.findMany({
      where: {
        key: { in: ["store_name", "store_email", "store_phone", "social_links"] },
      },
    });

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