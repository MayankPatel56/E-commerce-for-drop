import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { generateSlug } from "@/lib/slug";
import { z } from "zod";

// ─── Validation Schemas ───────────────────────────────────────────────────────

const variantSchema = z.object({
  id: z.number().int().optional(),
  sku: z.string().min(1, "SKU is required"),
  variantType: z.string().min(1, "Variant type is required"),
  variantValue: z.string().min(1, "Variant value is required"),
  price: z.number().min(0, "Price must be non-negative").optional().nullable(),
  stockQuantity: z.number().int("Stock must be an integer"),
});

const updateProductSchema = z.object({
  name: z.string().min(1, "Name is required").max(255).optional(),
  description: z.string().optional().nullable(),
  price: z.number().min(0, "Price must be non-negative").optional(),
  categoryId: z.number().int().positive("Category ID is required").optional(),
  primaryImage: z.string().optional().nullable(),
  galleryImages: z.array(z.string()).optional().nullable(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  isPublished: z.boolean().optional(),
  variants: z.array(variantSchema).optional(),
  tagIds: z.array(z.number().int()).optional(),
});

// ─── Slug Collision Handler ───────────────────────────────────────────────────

async function generateUniqueSlug(name: string, excludeId?: number): Promise<string> {
  const base = generateSlug(name);
  const existing = await db.product.findMany({
    where: { slug: { startsWith: base }, id: excludeId ? { not: excludeId } : undefined },
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

// ─── GET: Single product ──────────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const product = await db.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        variants: true,
        productTags: {
          include: { tag: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (err) {
    console.error("GET /api/admin/products/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── PUT: Update product ──────────────────────────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const existing = await db.product.findUnique({
      where: { id: productId },
      include: { variants: true, productTags: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Validate category if provided
    if (data.categoryId !== undefined) {
      const category = await db.category.findUnique({ where: { id: data.categoryId } });
      if (!category) {
        return NextResponse.json({ error: "Category not found" }, { status: 400 });
      }
    }

    // Handle variants if provided
    if (data.variants !== undefined) {
      // Validate SKU uniqueness: check within request
      const skuMap = new Map<string, number>();
      for (const v of data.variants) {
        const existingV = skuMap.get(v.sku);
        if (existingV !== undefined) {
          return NextResponse.json(
            { error: "Duplicate SKUs in request", details: { sku: v.sku } },
            { status: 400 }
          );
        }
        skuMap.set(v.sku, v.sku.length);
      }

      // Check for SKU conflicts with OTHER products (excluding current product's existing variants)
      const incomingSkus = data.variants.map((v) => v.sku);
      const existingVariantSkus = existing.variants.map((v) => v.sku);
      const newSkus = incomingSkus.filter(
        (s) => !existingVariantSkus.includes(s)
      );

      if (newSkus.length > 0) {
        const conflicts = await db.productVariant.findMany({
          where: { sku: { in: newSkus } },
          select: { sku: true },
        });
        if (conflicts.length > 0) {
          return NextResponse.json(
            { error: "Duplicate SKUs", details: { skus: conflicts.map((c) => c.sku) } },
            { status: 409 }
          );
        }
      }
    }

    // Validate tag IDs if provided
    if (data.tagIds !== undefined && data.tagIds.length > 0) {
      const tagCount = await db.tag.count({
        where: { id: { in: data.tagIds } },
      });
      if (tagCount !== data.tagIds.length) {
        return NextResponse.json({ error: "One or more tags not found" }, { status: 400 });
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) {
      const slug = await generateUniqueSlug(data.name, productId);
      updateData.name = data.name;
      updateData.slug = slug;
    }
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.primaryImage !== undefined) updateData.primaryImage = data.primaryImage;
    if (data.galleryImages !== undefined) {
      updateData.galleryImages =
        data.galleryImages && data.galleryImages.length > 0
          ? data.galleryImages
          : null;
    }
    if (data.seoTitle !== undefined) updateData.seoTitle = data.seoTitle;
    if (data.seoDescription !== undefined) updateData.seoDescription = data.seoDescription;
    if (data.isPublished !== undefined) updateData.isPublished = data.isPublished;

    // Update product
    const product = await db.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        category: true,
        variants: true,
        productTags: { include: { tag: true } },
      },
    });

    // Handle variant changes: add / update / delete
    if (data.variants !== undefined) {
      const incomingIds = new Set(
        data.variants.filter((v) => v.id !== undefined).map((v) => v.id!)
      );
      const existingIds = new Set(existing.variants.map((v) => v.id));

      // Delete variants that are no longer in the incoming list
      const toDelete = [...existingIds].filter((id) => !incomingIds.has(id));
      if (toDelete.length > 0) {
        await db.productVariant.deleteMany({ where: { id: { in: toDelete } } });
      }

      // Update or create variants
      for (const v of data.variants) {
        const variantData = {
          sku: v.sku,
          variantType: v.variantType,
          variantValue: v.variantValue,
          price: v.price ?? null,
          stockQuantity: v.stockQuantity,
          isOutOfStock: v.stockQuantity <= 0,
        };

        if (v.id !== undefined && existingIds.has(v.id)) {
          await db.productVariant.update({
            where: { id: v.id },
            data: variantData,
          });
        } else {
          await db.productVariant.create({
            data: {
              ...variantData,
              productId,
            },
          });
        }
      }
    }

    // Handle tag changes
    if (data.tagIds !== undefined) {
      // Delete all existing product tags
      await db.productTag.deleteMany({ where: { productId } });
      // Create new ones
      if (data.tagIds.length > 0) {
        await db.productTag.createMany({
          data: data.tagIds.map((tagId) => ({ productId, tagId })),
        });
      }
    }

    // Return updated product with fresh data
    const updated = await db.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        variants: true,
        productTags: { include: { tag: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PUT /api/admin/products/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE: Delete product ───────────────────────────────────────────────────

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const existing = await db.product.findUnique({ where: { id: productId } });
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await db.product.delete({ where: { id: productId } });

    return NextResponse.json({ message: "Product deleted" });
  } catch (err) {
    console.error("DELETE /api/admin/products/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}