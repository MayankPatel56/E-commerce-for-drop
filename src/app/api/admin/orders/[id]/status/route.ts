import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: ["return_requested"],
  return_requested: ["returned"],
  cancelled: [],
  returned: [],
};

const updateStatusSchema = z.object({
  status: z.string().min(1, "Status is required"),
  internalNotes: z.string().optional(),
});

/**
 * PATCH /api/admin/orders/[id]/status
 * Update order status (with valid transition checking)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = updateStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { status: newStatus, internalNotes } = parsed.data;

    // Find existing order
    const order = await db.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Validate status transition
    const allowed = VALID_TRANSITIONS[order.status] || [];
    if (!allowed.includes(newStatus)) {
      return NextResponse.json(
        {
          error: `Cannot transition from "${order.status}" to "${newStatus}"`,
          allowedTransitions: allowed,
        },
        { status: 400 }
      );
    }

    // Update order
    const updated = await db.order.update({
      where: { id: orderId },
      data: {
        status: newStatus,
        ...(internalNotes !== undefined ? { internalNotes } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      orderNumber: updated.orderNumber,
      status: updated.status,
      previousStatus: order.status,
    });
  } catch (error) {
    console.error("PATCH /api/admin/orders/[id]/status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}