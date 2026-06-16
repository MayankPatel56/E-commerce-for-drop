import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-auth";
import { z } from "zod";

const checkEligibilitySchema = z.object({
  productId: z.number().int().positive(),
});

/**
 * POST /api/reviews/check-eligibility
 * Check if the authenticated customer can review a specific product
 */
export async function POST(request: NextRequest) {
  const { error, customer } = await requireCustomer();
  if (error) return error;

  try {
    const body = await request.json();
    const result = checkEligibilitySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Valid productId is required" },
        { status: 400 }
      );
    }

    const { productId } = result.data;

    // Check for delivered order containing this product
    const deliveredOrder = await db.order.findFirst({
      where: {
        customerId: customer.userId,
        status: "delivered",
        orderItems: {
          some: {
            variant: { productId },
          },
        },
      },
      select: { id: true },
    });

    if (!deliveredOrder) {
      return NextResponse.json({
        eligible: false,
        reason: "You can only review products from delivered orders",
      });
    }

    // Check if already reviewed
    const existingReview = await db.review.findUnique({
      where: {
        productId_customerId: {
          productId,
          customerId: customer.userId,
        },
      },
      select: { id: true, status: true },
    });

    if (existingReview) {
      return NextResponse.json({
        eligible: false,
        reason: "You have already reviewed this product",
        existingReview: {
          id: existingReview.id,
          status: existingReview.status,
        },
      });
    }

    return NextResponse.json({
      eligible: true,
      orderId: deliveredOrder.id,
    });
  } catch {
    return NextResponse.json({ error: "Failed to check eligibility" }, { status: 500 });
  }
}