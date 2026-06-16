import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-auth";
import { z } from "zod";

const addWishlistSchema = z.object({
  productId: z.number().int().positive(),
});

/**
 * GET /api/customer/wishlist
 * Get customer's wishlist with product details
 */
export async function GET() {
  const { error, customer } = await requireCustomer();
  if (error) return error;

  try {
    const wishlist = await db.wishlist.findMany({
      where: { customerId: customer.userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            primaryImage: true,
            isPublished: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(wishlist);
  } catch {
    return NextResponse.json({ error: "Failed to fetch wishlist" }, { status: 500 });
  }
}

/**
 * POST /api/customer/wishlist
 * Add product to wishlist
 */
export async function POST(request: NextRequest) {
  const { error, customer } = await requireCustomer();
  if (error) return error;

  try {
    const body = await request.json();
    const result = addWishlistSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Valid productId is required" },
        { status: 400 }
      );
    }

    const { productId } = result.data;

    // Verify product exists and is published
    const product = await db.product.findUnique({
      where: { id: productId },
      select: { id: true, isPublished: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if already in wishlist (unique constraint)
    const existing = await db.wishlist.findUnique({
      where: {
        customerId_productId: {
          customerId: customer.userId,
          productId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Product already in wishlist" }, { status: 409 });
    }

    await db.wishlist.create({
      data: {
        customerId: customer.userId,
        productId,
      },
    });

    return NextResponse.json({ success: true, message: "Added to wishlist" });
  } catch {
    return NextResponse.json({ error: "Failed to add to wishlist" }, { status: 500 });
  }
}