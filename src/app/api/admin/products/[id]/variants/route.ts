import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { z } from "zod";

// ─── Validation Schema ────────────────────────────────────────────────────────

const createVariantSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  variantType: z.string().min(1, "Variant type is required"),
  variantValue: z.string().min(1, "Variant value is required"),
  price: z.number().min(0, "Price must be non-negative").optional().nullable(),
  stockQuantity: z.number().int("Stock must be an integer"),
});

// ─── POST: Add a single variant to a product ──────────────────────────────────

export async function POST(
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

    // Check product exists
    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createVariantSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Validate SKU uniqueness globally
    const existingSku = await db.productVariant.findUnique({
      where: { sku: data.sku },
    });
    if (existingSku) {
      return NextResponse.json(
        { error: "SKU already exists", details: { sku: data.sku } },
        { status: 409 }
      );
    }

    const variant = await db.productVariant.create({
      data: {
        productId,
        sku: data.sku,
        variantType: data.variantType,
        variantValue: data.variantValue,
        price: data.price ?? null,
        stockQuantity: data.stockQuantity,
        // isOutOfStock is set automatically by DB trigger (set_is_out_of_stock)
      },
    });

    return NextResponse.json(variant, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/products/[id]/variants error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}