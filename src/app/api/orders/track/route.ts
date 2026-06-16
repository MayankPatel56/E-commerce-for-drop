import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { checkTrackingRateLimit } from "@/lib/rate-limit";

const trackQuerySchema = z.object({
  orderNumber: z.string().min(1, "Order number is required"),
  email: z.string().email("Enter a valid email address"),
});

/**
 * GET /api/orders/track
 * Guest order tracking: Order Number + Email
 * Rate limited: 10 attempts per 15 minutes per IP
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";

    const { allowed } = await checkTrackingRateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many tracking attempts. Please try again in 15 minutes." },
        { status: 429 }
      );
    }

    // 2. Validate query params
    const { searchParams } = new URL(request.url);
    const parsed = trackQuerySchema.safeParse({
      orderNumber: searchParams.get("orderNumber") || "",
      email: searchParams.get("email") || "",
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { orderNumber, email } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // 3. Find order by order number
    const order = await db.order.findUnique({
      where: { orderNumber },
      include: {
        orderItems: {
          include: {
            variant: {
              include: { product: { select: { name: true, primaryImage: true } } },
            },
          },
        },
        customer: {
          select: { email: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // 4. Verify email matches (case-insensitive)
    if (order.customer?.email.toLowerCase() !== normalizedEmail) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // 5. Return tracking info (don't expose internal notes)
    const address = order.shippingAddress as Record<string, string>;

    return NextResponse.json({
      orderNumber: order.orderNumber,
      status: order.status,
      cartTotal: order.cartTotal,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      shippingAddress: address,
      items: order.orderItems.map((item) => ({
        variantSnapshot: item.variantSnapshot ?? null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.unitPrice * item.quantity,
      })),
    });
  } catch (error) {
    console.error("GET /api/orders/track error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}