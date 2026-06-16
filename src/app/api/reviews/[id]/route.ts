import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-auth";

/**
 * PUT /api/reviews/[id]
 * Edit a review (own reviews only). Status returns to 'pending'.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, customer } = await requireCustomer();
  if (error) return error;

  try {
    const { id: idStr } = await params;
    const reviewId = parseInt(idStr, 10);
    if (isNaN(reviewId)) {
      return NextResponse.json({ error: "Invalid review ID" }, { status: 400 });
    }

    const body = await request.json();
    const { rating, title, comment } = body;

    if (rating !== undefined && (typeof rating !== "number" || rating < 1 || rating > 5)) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    // Verify review belongs to this customer
    const existing = await db.review.findUnique({
      where: { id: reviewId },
      select: { customerId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (existing.customerId !== customer.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = { status: "pending" };
    if (rating !== undefined) updateData.rating = rating;
    if (title !== undefined) updateData.title = title;
    if (comment !== undefined) updateData.comment = comment;

    const updated = await db.review.update({
      where: { id: reviewId },
      data: updateData,
    });

    return NextResponse.json({ success: true, review: updated });
  } catch {
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}