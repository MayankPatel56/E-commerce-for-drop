import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * GET /api/admin/orders
 * Admin order list with filters, search, and pending count
 */
export async function GET(request: NextRequest) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const sortBy = searchParams.get("sortBy") || "newest";

    // Build where clause
    const where: Record<string, unknown> = {};
    if (status && status !== "all") {
      where.status = status;
    }
    if (search) {
      where.orderNumber = { contains: search };
    }

    // Build orderBy
    const orderBy: Record<string, string> =
      sortBy === "oldest" ? { createdAt: "asc" } : { createdAt: "desc" };

    // Get pending count (for badge display — Resolution #11)
    const pendingCount = await db.order.count({
      where: { status: "pending" },
    });

    // Get total count for pagination
    const total = await db.order.count({ where });

    // Fetch orders with customer info
    const orders = await db.order.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        customer: {
          select: { name: true, email: true, phone: true },
        },
        orderItems: {
          select: { quantity: true, unitPrice: true },
        },
      },
    });

    return NextResponse.json({
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        cartTotal: order.cartTotal,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        consentGiven: order.consentGiven,
        customer: order.customer
          ? { name: order.customer.name, email: order.customer.email, phone: order.customer.phone }
          : null,
        itemCount: order.orderItems.reduce((sum, item) => sum + item.quantity, 0),
      })),
      pendingCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/admin/orders error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}