import { db } from "@/lib/db";
import type {
  ProductCategory,
  ProductTag,
  Product,
  ProductFeature,
  ProductBundleOffer,
} from "./product-types";

interface FetchProductsOptions {
  categorySlug?: string;
  tagIds?: number[];
  inStockOnly?: boolean;
  minPrice?: number;
  maxPrice?: number;
  searchQuery?: string;
  sort?: "newest" | "price_asc" | "price_desc" | "name_asc";
  page?: number;
  limit?: number;
}

interface ProductListingData {
  products: Product[];
  categories: (ProductCategory & { productCount: number })[];
  tags: (ProductTag & { productCount: number })[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Fetches product listing data (products, categories, tags) from Prisma.
 * Designed for server-side usage.
 */
export async function fetchProductListingData(
  options: FetchProductsOptions
): Promise<ProductListingData> {
  const { categorySlug, tagIds, inStockOnly, minPrice, maxPrice, searchQuery, sort, page = 1, limit = 20 } = options;

  const productWhere: Record<string, unknown> = { isPublished: true };

  if (categorySlug) {
    productWhere.category = { slug: categorySlug };
  }

  if (inStockOnly) {
    productWhere.variants = {
      some: { isOutOfStock: false, stockQuantity: { gt: 0 } },
    };
  }

  if (minPrice || maxPrice) {
    productWhere.price = {};
    if (minPrice !== undefined) {
      (productWhere.price as Record<string, unknown>).gte = minPrice;
    }
    if (maxPrice !== undefined) {
      (productWhere.price as Record<string, unknown>).lte = maxPrice;
    }
  }

  if (searchQuery) {
    productWhere.name = { contains: searchQuery, mode: "insensitive" };
  }

  if (tagIds && tagIds.length > 0) {
    productWhere.productTags = {
      some: {
        tagId: { in: tagIds },
      },
    };
  }

  let orderBy: Record<string, string> = { createdAt: "desc" };
  if (sort === "price_asc") orderBy = { price: "asc" };
  else if (sort === "price_desc") orderBy = { price: "desc" };
  else if (sort === "name_asc") orderBy = { name: "asc" };

  const skip = (page - 1) * limit;

  // Fetch data in parallel (first pass)
  const [totalProducts, productsData, categoriesData, tagsData] = await Promise.all([
    db.product.count({ where: productWhere }),
    db.product.findMany({
      where: productWhere,
      orderBy,
      skip,
      take: limit,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: {
          select: {
            id: true,
            sku: true,
            variantType: true,
            variantValue: true,
            colorHex: true,
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
        _count: { select: { reviews: { where: { status: "approved" } } } },
      },
    }),
    db.category.findMany({
      select: { id: true, name: true, slug: true, _count: { select: { products: { where: { isPublished: true } } } } },
      orderBy: { name: "asc" },
    }),
    db.tag.findMany({
      select: { id: true, name: true, _count: { select: { productTags: { where: { product: { isPublished: true } } } } } },
      orderBy: { name: "asc" },
    }),
  ]);

  // Fetch rating aggregates in a second step (productsData is now available)
  const ratingAggregates = await db.review.groupBy({
    by: ["productId"],
    where: { productId: { in: productsData.map(p => p.id) }, status: "approved" },
    _avg: { rating: true },
    _count: { rating: true },
  });

  const ratingMap = new Map<number, { avg: number; count: number }>();
  for (const ra of ratingAggregates) {
    ratingMap.set(ra.productId, {
      avg: ra._avg.rating ? Math.round(ra._avg.rating * 10) / 10 : 0,
      count: ra._count.rating,
    });
  }

  const products: Product[] = productsData.map((p) => {
    const galleryImages: string[] = (p.galleryImages as string[] | null) ?? [];
    const rating = ratingMap.get(p.id) || { avg: 0, count: 0 };

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
    for (const v of p.variants) {
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
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      badgeText: p.badgeText,
      soldLabel: p.soldLabel,
      videoUrl: p.videoUrl,
      features: (p.features as ProductFeature[] | null) ?? [],
      bundleOffers: (p.bundleOffers as ProductBundleOffer[] | null) ?? [],
      primaryImage: p.primaryImage,
      galleryImages,
      seoTitle: p.seoTitle,
      seoDescription: p.seoDescription,
      category: p.category,
      variants: p.variants.map(v => ({
        ...v,
        sku: v.sku ?? "",
      })),
      variantTypes,
      tags: p.productTags.map((pt) => pt.tag),
      reviews: [], // Reviews are not fetched in listing for performance
      averageRating: rating.avg,
      reviewCount: rating.count,
      createdAt: p.createdAt.toISOString(),
      inStock: p.variants.some(v => !v.isOutOfStock && v.stockQuantity > 0),
    };
  });

  const categories = categoriesData.map(c => ({ ...c, productCount: c._count.products }));
  const tags = tagsData.map(t => ({ ...t, productCount: t._count.productTags }));

  return {
    products,
    categories,
    tags,
    pagination: {
      page,
      limit,
      total: totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
    },
  };
}