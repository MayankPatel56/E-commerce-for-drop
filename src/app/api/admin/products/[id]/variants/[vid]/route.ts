import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { z } from "zod";

// ─── Validation Schema ────────────────────────────────────────────────────────

const updateVariantSchema = z.object({
  sku: z.string().min(1, "SKU is required").optional(),
  variantType: z.string().min(1, "Variant type is required").optional(),
  variantValue: z.string().min(1, "Variant value is required").optional(),
  price: z.number().min(0, "Price must be non-negative").optional().nullable(),
  stockQuantity: z.number().int("Stock must be an integer").optional(),
});

// ─── PUT: Update a variant ────────────────────────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; vid: string }> }
) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { vid } = await params;
    const variantId = parseInt(vid, 10);
    if (isNaN(variantId)) {
      return NextResponse.json({ error: "Invalid variant ID" }, { status: 400 });
    }

    const existing = await db.productVariant.findUnique({ where: { id: variantId } });
    if (!existing) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateVariantSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // If SKU is changing, validate uniqueness
    if (data.sku !== undefined && data.sku !== existing.sku) {
      const skuConflict = await db.productVariant.findUnique({
        where: { sku: data.sku },
      });
      if (skuConflict) {
        return NextResponse.json(
          { error: "SKU already exists", details: { sku: data.sku } },
          { status: 409 }
        );
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.variantType !== undefined) updateData.variantType = data.variantType;
    if (data.variantValue !== undefined) updateData.variantValue = data.variantValue;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.stockQuantity !== undefined) {
      updateData.stockQuantity = data.stockQuantity;
      // isOutOfStock is set automatically by DB trigger (set_is_out_of_stock)
    }

    const variant = await db.productVariant.update({
      where: { id: variantId },
      data: updateData,
    });

    return NextResponse.json(variant);
  } catch (err) {
    console.error("PUT /api/admin/products/[id]/variants/[vid] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE: Remove a variant ─────────────────────────────────────────────────

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; vid: string }> }
) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { vid } = await params;
    const variantId = parseInt(vid, 10);
    if (isNaN(variantId)) {
      return NextResponse.json({ error: "Invalid variant ID" }, { status: 400 });
    }

    const existing = await db.productVariant.findUnique({ where: { id: variantId } });
    if (!existing) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    }

    await db.productVariant.delete({ where: { id: variantId } });

    return NextResponse.json({ message: "Variant deleted" });
  } catch (err) {
    console.error("DELETE /api/admin/products/[id]/variants/[vid] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}