import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const guestHistorySchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

/**
 * GET /api/orders/guest-history
 * List all orders for a guest customer by email
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = guestHistorySchema.safeParse({
      email: searchParams.get("email") || "",
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = parsed.data.email.toLowerCase().trim();

    // Find customer by email
    const customer = await db.customer.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true },
    });

    if (!customer) {
      return NextResponse.json({ orders: [] });
    }

    // Get orders for this customer
    const orders = await db.order.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        cartTotal: true,
        createdAt: true,
        updatedAt: true,
        orderItems: {
          select: {
            quantity: true,
            unitPrice: true,
            variantSnapshot: true,
          },
        },
      },
    });

    return NextResponse.json({
      orders: orders.map((order) => ({
        ...order,
        itemCount: order.orderItems.reduce((sum, item) => sum + item.quantity, 0),
        orderItems: order.orderItems.map((item) => ({
          variantSnapshot: item.variantSnapshot ?? null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.unitPrice * item.quantity,
        })),
      })),
    });
  } catch (error) {
    console.error("GET /api/orders/guest-history error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}