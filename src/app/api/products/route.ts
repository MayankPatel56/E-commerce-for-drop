import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

/**
 * GET /api/products — Public product listing with multi-tag filter support
 * Query params: category (slug), tags (comma-separated ids), inStock (true/false),
 *               minPrice, maxPrice, search, sort, page, limit
 * Resolution #9: Multi-tag filtering — products matching ANY of the selected tags
 * Plan Reference: Phase 9 ISR — revalidate = 3600 (1 hour)
 *
 * Caching: query results are cached for 5 minutes via unstable_cache, tagged
 * "products" so admin mutations can invalidate immediately with revalidateTag.
 */

// ✅ FIX: Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// ✅ Keep ISR revalidation for the page that uses this data
export const revalidate = 3600;

const getCachedProductList = unstable_cache(
  async (
    where: Record<string, unknown>,
    orderBy: Record<string, string>,
    skip: number,
    limit: number
  ) => {
    // Parallel: count + findMany are independent of each other
    const [total, products] = await Promise.all([
      db.product.count({ where }),
      db.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          variants: {
            select: {
              id: true,
              variantType: true,
              variantValue: true,
              price: true,
              stockQuantity: true,
              isOutOfStock: true,
            },
          },
          productTags: {
            include: {
              tag: { select: { id: true, name: true } },
            },
          },
          _count: {
            select: { reviews: { where: { status: "approved" } } },
          },
        },
      }),
    ]);

    const productIds = products.map((p) => p.id);
    const ratingAggregates = productIds.length > 0
      ? await db.review.groupBy({
          by: ["productId"],
          where: {
            productId: { in: productIds },
            status: "approved",
          },
          _avg: { rating: true },
          _count: { rating: true },
        })
      : [];

    return { total, products, ratingAggregates };
  },
  ["products-list"],
  { revalidate: 300, tags: ["products"] } // 5 minute cache, invalidated by admin writes
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const categorySlug = searchParams.get("category") || undefined;
    const tagsParam = searchParams.get("tags") || undefined;
    const inStockParam = searchParams.get("inStock");
    const minPriceParam = searchParams.get("minPrice");
    const maxPriceParam = searchParams.get("maxPrice");
    const searchQuery = searchParams.get("search") || undefined;
    const sort = searchParams.get("sort") || "newest";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    const tagIds = tagsParam
      ? tagsParam
          .split(",")
          .map((id) => parseInt(id.trim(), 10))
          .filter((id) => !isNaN(id) && id > 0)
      : [];

    const where: Record<string, unknown> = { isPublished: true };

    if (categorySlug) {
      where.category = { slug: categorySlug };
    }

    if (inStockParam === "true") {
      where.variants = {
        some: { isOutOfStock: false, stockQuantity: { gt: 0 } },
      };
    }

    if (minPriceParam || maxPriceParam) {
      where.price = {};
      if (minPriceParam) {
        (where.price as Record<string, unknown>).gte = parseFloat(minPriceParam);
      }
      if (maxPriceParam) {
        (where.price as Record<string, unknown>).lte = parseFloat(maxPriceParam);
      }
    }

    if (searchQuery) {
      where.name = { contains: searchQuery };
    }

    if (tagIds.length > 0) {
      where.productTags = {
        some: {
          tagId: { in: tagIds },
        },
      };
    }

    let orderBy: Record<string, string> = { createdAt: "desc" };
    if (sort === "price_asc") orderBy = { price: "asc" };
    else if (sort === "price_desc") orderBy = { price: "desc" };
    else if (sort === "newest") orderBy = { createdAt: "desc" };
    else if (sort === "name_asc") orderBy = { name: "asc" };

    const { total, products, ratingAggregates } = await getCachedProductList(
      where,
      orderBy,
      (page - 1) * limit,
      limit
    );

    const ratingMap = new Map<number, { avg: number; count: number }>();
    for (const ra of ratingAggregates) {
      ratingMap.set(ra.productId, {
        avg: ra._avg.rating ? Math.round(ra._avg.rating * 10) / 10 : 0,
        count: ra._count.rating,
      });
    }

    return NextResponse.json({
      products: products.map((p) => {
        const galleryImages: string[] = (p.galleryImages as string[] | null) ?? [];
        const rating = ratingMap.get(p.id) || { avg: 0, count: 0 };
        const hasInStockVariant = p.variants.some((v) => !v.isOutOfStock && v.stockQuantity > 0);

        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          price: p.price,
          primaryImage: p.primaryImage,
          galleryImages,
          category: p.category,
          variants: p.variants,
          tags: p.productTags.map((pt) => pt.tag),
          inStock: hasInStockVariant || (!p.variants.length && p.price > 0),
          reviewCount: p._count.reviews,
          averageRating: rating.avg,
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}