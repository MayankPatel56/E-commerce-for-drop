import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

const returnSchema = z.object({
  internalNotes: z.string().min(1, "Return notes are required"),
});

/**
 * POST /api/admin/orders/[id]/return
 * Process return request — only for "return_requested" orders
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
    const parsed = returnSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Find order — must be in "return_requested" status
    const order = await db.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "return_requested") {
      return NextResponse.json(
        { error: `Order is "${order.status}". Return processing is only for "return_requested" orders.` },
        { status: 400 }
      );
    }

    // Mark as returned
    const updated = await db.order.update({
      where: { id: orderId },
      data: {
        status: "returned",
        internalNotes: parsed.data.internalNotes,
      },
    });

    return NextResponse.json({
      success: true,
      orderNumber: updated.orderNumber,
      status: updated.status,
      message: "Return processed successfully.",
    });
  } catch (error) {
    console.error("POST /api/admin/orders/[id]/return error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}