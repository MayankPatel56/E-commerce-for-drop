import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const cartItemSchema = z.object({
  variant_id: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

const validateBodySchema = z.object({
  cart: z.array(cartItemSchema).min(1, "Cart cannot be empty"),
});

/**
 * POST /api/orders/validate
 * Validates the cart before checkout:
 * - Checks COD min/max range
 * - Checks stock availability for each variant
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = validateBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { cart } = parsed.data;

    // 1. Get COD settings
    const settings = await db.setting.findMany({
      where: { key: { in: ["cod_min_order", "cod_max_order"] } },
    });

    let codMin = 0;
    let codMax = 50000;
    for (const s of settings) {
      const parsed_val = JSON.parse(s.value);
      if (s.key === "cod_min_order") codMin = parsed_val.value ?? 0;
      if (s.key === "cod_max_order") codMax = parsed_val.value ?? 50000;
    }

    // 2. Fetch all variants in the cart
    const variantIds = cart.map((item) => item.variant_id);
    const variants = await db.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: { select: { id: true, name: true, price: true, isPublished: true } } },
    });

    // Build a map for quick lookup
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    // 3. Validate each cart item
    let cartTotal = 0;
    const invalidItems: string[] = [];
    const insufficientStock: string[] = [];

    for (const item of cart) {
      const variant = variantMap.get(item.variant_id);

      if (!variant) {
        invalidItems.push(`Variant ID ${item.variant_id} not found`);
        continue;
      }

      if (!variant.product.isPublished) {
        invalidItems.push(`${variant.product.name} is no longer available`);
        continue;
      }

      if (variant.stockQuantity < item.quantity) {
        insufficientStock.push(
          `${variant.product.name} (${variant.variantType}: ${variant.variantValue}) — only ${variant.stockQuantity} in stock`
        );
      }

      const unitPrice = variant.price ?? variant.product.price;
      cartTotal += unitPrice * item.quantity;
    }

    if (invalidItems.length > 0) {
      return NextResponse.json(
        { error: "Some items are no longer available", invalidItems },
        { status: 400 }
      );
    }

    if (insufficientStock.length > 0) {
      return NextResponse.json(
        { error: "Insufficient stock for some items", insufficientStock },
        { status: 400 }
      );
    }

    // 4. Validate COD range
    if (cartTotal < codMin) {
      return NextResponse.json(
        {
          error: `COD available for orders above ₹${codMin.toLocaleString("en-IN")}`,
          codMin,
          codMax,
          cartTotal,
        },
        { status: 400 }
      );
    }

    if (cartTotal > codMax) {
      return NextResponse.json(
        {
          error: `COD available for orders up to ₹${codMax.toLocaleString("en-IN")}`,
          codMin,
          codMax,
          cartTotal,
        },
        { status: 400 }
      );
    }

    // 5. Return validation success with calculated totals
    return NextResponse.json({
      valid: true,
      cartTotal,
      codMin,
      codMax,
      itemCount: cart.reduce((sum, i) => sum + i.quantity, 0),
    });
  } catch (error) {
    console.error("POST /api/orders/validate error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}