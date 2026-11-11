import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { z } from "zod";

const updateReviewSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().max(100).optional(),
  comment: z.string().max(1000).optional(),
});

/**
 * PUT /api/reviews/[id]
 * Update a review (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const reviewId = parseInt(id, 10);
    if (isNaN(reviewId)) {
      return NextResponse.json(
        { error: "Invalid review ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const result = updateReviewSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { status, rating, title, comment } = result.data;

    // Check if review exists
    const existingReview = await db.review.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    // Update review
    const updatedReview = await db.review.update({
      where: { id: reviewId },
      data: {
        status,
        ...(rating !== undefined && { rating }),
        ...(title !== undefined && { title }),
        ...(comment !== undefined && { comment }),
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, review: updatedReview });
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reviews/[id]
 * Delete a review (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const reviewId = parseInt(id, 10);
    if (isNaN(reviewId)) {
      return NextResponse.json(
        { error: "Invalid review ID" },
        { status: 400 }
      );
    }

    // Check if review exists
    const existingReview = await db.review.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    // Delete review
    await db.review.delete({
      where: { id: reviewId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }
}