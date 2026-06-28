import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { generateSlug } from "@/lib/slug";
import { revalidateTag } from "next/cache";
import { z } from "zod";

// ─── Validation Schemas ───────────────────────────────────────────────────────

const variantSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  variantType: z.string().min(1, "Variant type is required"),
  variantValue: z.string().min(1, "Variant value is required"),
  price: z.number().min(0, "Price must be non-negative").optional().nullable(),
  stockQuantity: z.number().int("Stock must be an integer"),
});

const createProductSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional().nullable(),
  price: z.number().min(0, "Price must be non-negative"),
  categoryId: z.number().int().positive("Category ID is required"),
  primaryImage: z.string().optional().nullable(),
  galleryImages: z.array(z.string()).optional().default([]),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  isPublished: z.boolean().optional().default(false),
  variants: z.array(variantSchema).optional().default([]),
  tagIds: z.array(z.number().int()).optional().default([]),
});

// ─── Slug Collision Handler ───────────────────────────────────────────────────

async function generateUniqueSlug(name: string): Promise<string> {
  const base = generateSlug(name);
  const existing = await db.product.findMany({
    where: { slug: { startsWith: base } },
    select: { slug: true },
  });

  if (!existing.some((p) => p.slug === base)) {
    return base;
  }

  let counter = 2;
  while (existing.some((p) => p.slug === `${base}-${counter}`)) {
    counter++;
  }
  return `${base}-${counter}`;
}

// ─── GET: List products with filters ──────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = request.nextUrl;
    const categoryId = searchParams.get("category");
    const search = searchParams.get("search");
    const inStock = searchParams.get("inStock");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));
    const sort = searchParams.get("sort") || "newest";

    // Build where clause
    const where: Record<string, unknown> = {
      deletedAt: null,
    };
    if (categoryId) where.categoryId = parseInt(categoryId, 10);
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }
    if (inStock !== null && inStock !== undefined && inStock !== "") {
      const wantInStock = inStock === "true";
      if (wantInStock) {
        where.variants = { some: { isOutOfStock: false } };
      } else {
        where.variants = { every: { isOutOfStock: true } };
      }
    }

    // Build orderBy
    let orderBy: Record<string, string> = { createdAt: "desc" };
    if (sort === "price_asc") orderBy = { price: "asc" };
    else if (sort === "price_desc") orderBy = { price: "desc" };

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { name: true } },
          variants: {select: {id: true,stockQuantity: true,isOutOfStock: true,},},
          productTags: {
            include: { tag: { select: { name: true } } },
          },
        },
      }),
      db.product.count({ where }),
    ]);

    const formatted = products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      primaryImage: p.primaryImage,
      galleryImages: p.galleryImages,
      seoTitle: p.seoTitle,
      seoDescription: p.seoDescription,
      isPublished: p.isPublished,
      categoryId: p.categoryId,
      categoryName: p.category.name,
      variantCount: p.variants.length,
      inStock: p.variants.some((v) => !v.isOutOfStock && v.stockQuantity > 0),totalStock: p.variants.reduce((sum, v) => sum + v.stockQuantity,0),
      tagNames: p.productTags.map((pt) => pt.tag.name),
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return NextResponse.json({
      products: formatted,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("GET /api/admin/products error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST: Create product ─────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Validate category exists
    const category = await db.category.findUnique({ where: { id: data.categoryId } });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 400 });
    }

    // Validate SKUs are unique globally
    const skus = data.variants.map((v) => v.sku);
    if (skus.length > 0) {
      const existingSkus = await db.productVariant.findMany({
        where: { sku: { in: skus } },
        select: { sku: true },
      });
      if (existingSkus.length > 0) {
        const duplicateSkus = existingSkus.map((s) => s.sku);
        return NextResponse.json(
          { error: "Duplicate SKUs", details: { skus: duplicateSkus } },
          { status: 409 }
        );
      }

      // Check for duplicates within the request itself
      const skuSet = new Set<string>();
      const localDuplicates: string[] = [];
      for (const sku of skus) {
        if (skuSet.has(sku) && !localDuplicates.includes(sku)) {
          localDuplicates.push(sku);
        }
        skuSet.add(sku);
      }
      if (localDuplicates.length > 0) {
        return NextResponse.json(
          { error: "Duplicate SKUs in request", details: { skus: localDuplicates } },
          { status: 400 }
        );
      }
    }

    // Validate tag IDs
    if (data.tagIds.length > 0) {
      const tagCount = await db.tag.count({
        where: { id: { in: data.tagIds } },
      });
      if (tagCount !== data.tagIds.length) {
        return NextResponse.json({ error: "One or more tags not found" }, { status: 400 });
      }
    }

    // Generate unique slug
    const slug = await generateUniqueSlug(data.name);

    // Create product
    const product = await db.product.create({
      data: {
        name: data.name,
        slug,
        description: data.description ?? null,
        price: data.price,
        categoryId: data.categoryId,
        primaryImage: data.primaryImage ?? null,
        galleryImages: (data.galleryImages.length > 0 ? data.galleryImages : null) as any,
        seoTitle: data.seoTitle ?? null,
        seoDescription: data.seoDescription ?? null,
        isPublished: data.isPublished,
        variants: {
          create: data.variants.map((v) => ({
            sku: v.sku,
            variantType: v.variantType,
            variantValue: v.variantValue,
            price: v.price ?? null,
            stockQuantity: v.stockQuantity,
            // isOutOfStock set by DB trigger
          })),
        },
        productTags: {
          create: data.tagIds.map((tagId) => ({ tagId })),
        },
      },
      include: {
        category: true,
        variants: true,
        productTags: { include: { tag: true } },
      },
    });

    // ✅ Invalidate products cache only after successful creation
    revalidateTag("products",  { expire: 0 });

    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/products error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}