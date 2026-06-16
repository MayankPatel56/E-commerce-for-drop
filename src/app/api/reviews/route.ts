import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-auth";
import { z } from "zod";

const reviewSchema = z.object({
  productId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  comment: z.string().max(1000).optional(),
});

/**
 * POST /api/reviews
 * Submit a review (registered customers only, purchase-validated)
 */
export async function POST(request: NextRequest) {
  const { error, customer } = await requireCustomer();
  if (error) return error;

  try {
    const body = await request.json();
    const result = reviewSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { productId, rating, title, comment } = result.data;

    // Rate limit: 5 reviews per hour per customer
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentReviews = await db.review.count({
      where: {
        customerId: customer.userId,
        createdAt: { gte: oneHourAgo },
      },
    });
    if (recentReviews >= 5) {
      return NextResponse.json(
        { error: "You can submit at most 5 reviews per hour. Please try again later." },
        { status: 429 }
      );
    }

    // 1. Verify delivered order containing this product
    const deliveredOrder = await db.order.findFirst({
      where: {
        customerId: customer.userId,
        status: "delivered",
        orderItems: {
          some: {
            variant: {
              productId,
            },
          },
        },
      },
      select: { id: true },
    });

    if (!deliveredOrder) {
      return NextResponse.json(
        { error: "You can only review products you have purchased and received" },
        { status: 403 }
      );
    }

    // 2. Check if already reviewed (DB has unique constraint, but check for clean error)
    const existingReview = await db.review.findUnique({
      where: {
        productId_customerId: {
          productId,
          customerId: customer.userId,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 409 }
      );
    }

    // 3. Create review with status='pending'
    const review = await db.review.create({
      data: {
        productId,
        customerId: customer.userId,
        orderId: deliveredOrder.id,
        rating,
        title,
        comment,
        status: "pending",
      },
      include: {
        customer: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({ success: true, review });
  } catch {
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}