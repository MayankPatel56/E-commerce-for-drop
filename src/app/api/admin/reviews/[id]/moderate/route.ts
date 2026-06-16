import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { z } from "zod";

// Review moderation state machine
const REVIEW_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["approved", "rejected"],
  approved: ["hidden"],
  rejected: [],
  hidden: ["approved"],
};

const moderateSchema = z.object({
  action: z.enum(["approve", "reject", "hide", "delete"]),
});

/**
 * PATCH /api/admin/reviews/[id]/moderate
 * Approve/reject/hide/delete a review
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  try {
    const { id: idStr } = await params;
    const reviewId = parseInt(idStr, 10);
    if (isNaN(reviewId)) {
      return NextResponse.json({ error: "Invalid review ID" }, { status: 400 });
    }

    const body = await request.json();
    const result = moderateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Action must be one of: approve, reject, hide, delete" },
        { status: 400 }
      );
    }

    const { action } = result.data;

    // For delete, just delete the record
    if (action === "delete") {
      await db.review.delete({ where: { id: reviewId } });
      return NextResponse.json({ success: true, action: "deleted" });
    }

    // Get current review
    const review = await db.review.findUnique({
      where: { id: reviewId },
      select: { status: true },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Map action to target status
    const actionToStatus: Record<string, string> = {
      approve: "approved",
      reject: "rejected",
      hide: "hidden",
    };

    const targetStatus = actionToStatus[action];

    // Validate transition
    const allowedTransitions = REVIEW_STATUS_TRANSITIONS[review.status] || [];
    if (!allowedTransitions.includes(targetStatus)) {
      return NextResponse.json(
        { error: `Cannot transition from "${review.status}" to "${targetStatus}"` },
        { status: 400 }
      );
    }

    const updated = await db.review.update({
      where: { id: reviewId },
      data: { status: targetStatus },
    });

    return NextResponse.json({ success: true, review: updated });
  } catch {
    return NextResponse.json({ error: "Failed to moderate review" }, { status: 500 });
  }
}