import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/search — Search products by query string
 * Searches product name and description. Returns same shape as /api/products listing.
 * Query params: q (search term), page, limit
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const query = searchParams.get("q") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    if (!query.trim()) {
      return NextResponse.json({ products: [], pagination: { page, limit, total: 0, totalPages: 0 } });
    }

    const where = {
      isPublished: true,
      OR: [
        { name: { contains: query.trim() } },
        { description: { contains: query.trim() } },
      ],
    };

    const total = await db.product.count({ where });

    const products = await db.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
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

    // Batch rating aggregation
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
        const galleryImages: string[] = p.galleryImages ? JSON.parse(p.galleryImages) : [];
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
      query,
    });
  } catch (error) {
    console.error("GET /api/search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}