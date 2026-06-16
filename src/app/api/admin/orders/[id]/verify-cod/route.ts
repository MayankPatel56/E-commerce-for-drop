import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

const verifyCodSchema = z.object({
  internalNotes: z.string().optional(),
});

/**
 * POST /api/admin/orders/[id]/verify-cod
 * Manual COD verification workflow (Resolution #11):
 * Admin calls customer → customer confirms → admin marks as confirmed
 */
export async function POST(
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
    const parsed = verifyCodSchema.safeParse(body || {});

    const internalNotes = parsed.success ? parsed.data.internalNotes : undefined;

    // Find order — must be in "pending" status
    const order = await db.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "pending") {
      return NextResponse.json(
        { error: `Order is already "${order.status}". COD verification is only for pending orders.` },
        { status: 400 }
      );
    }

    // Mark as confirmed
    const updated = await db.order.update({
      where: { id: orderId },
      data: {
        status: "confirmed",
        ...(internalNotes !== undefined ? { internalNotes } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      orderNumber: updated.orderNumber,
      status: updated.status,
      message: "Order marked as confirmed. COD verification complete.",
    });
  } catch (error) {
    console.error("POST /api/admin/orders/[id]/verify-cod error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}