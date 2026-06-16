import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/products — Public product listing with multi-tag filter support
 * Query params: category (slug), tags (comma-separated ids), inStock (true/false),
 *               minPrice, maxPrice, search, sort, page, limit
 * Resolution #9: Multi-tag filtering — products matching ANY of the selected tags
 * Plan Reference: Phase 9 ISR — revalidate = 3600 (1 hour)
 */
export const revalidate = 3600;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    // Parse query parameters
    const categorySlug = searchParams.get("category") || undefined;
    const tagsParam = searchParams.get("tags") || undefined;
    const inStockParam = searchParams.get("inStock");
    const minPriceParam = searchParams.get("minPrice");
    const maxPriceParam = searchParams.get("maxPrice");
    const searchQuery = searchParams.get("search") || undefined;
    const sort = searchParams.get("sort") || "newest";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    // Parse tags (Resolution #9)
    const tagIds = tagsParam
      ? tagsParam
          .split(",")
          .map((id) => parseInt(id.trim(), 10))
          .filter((id) => !isNaN(id) && id > 0)
      : [];

    // Build where clause
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

    // Multi-tag filter: products that have ANY of the selected tags
    if (tagIds.length > 0) {
      where.productTags = {
        some: {
          tagId: { in: tagIds },
        },
      };
    }

    // Build order by
    let orderBy: Record<string, string> = { createdAt: "desc" };
    if (sort === "price_asc") orderBy = { price: "asc" };
    else if (sort === "price_desc") orderBy = { price: "desc" };
    else if (sort === "newest") orderBy = { createdAt: "desc" };
    else if (sort === "name_asc") orderBy = { name: "asc" };

    // Count total (for pagination)
    const total = await db.product.count({ where });

    // Fetch products
    const products = await db.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
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
    });

    // Calculate average rating per product from approved reviews
    // Batch query for efficiency
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