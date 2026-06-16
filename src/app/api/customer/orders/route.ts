import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-auth";

/**
 * GET /api/customer/orders
 * List the authenticated customer's orders with items, ordered by newest first.
 * Supports pagination via ?page=1&limit=10
 */
export async function GET(request: NextRequest) {
  const { error, customer } = await requireCustomer();
  if (error) return error;

  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where: { customerId: customer.userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          orderItems: {
            include: {
              variant: {
                select: {
                  id: true,
                  sku: true,
                  variantType: true,
                  variantValue: true,
                  product: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                      primaryImage: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      db.order.count({
        where: { customerId: customer.userId },
      }),
    ]);

    return NextResponse.json({ orders, total });
  } catch {
    return NextResponse.json(
      { error: "Failed to load orders" },
      { status: 500 }
    );
  }
}
