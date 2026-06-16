import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-auth";

/**
 * GET /api/customer/dashboard
 * Returns overview data: recent orders, wishlist preview, pending review count
 */
export async function GET() {
  const { error, customer } = await requireCustomer();
  if (error) return error;

  try {
    // Fetch recent orders (last 5)
    const recentOrders = await db.order.findMany({
      where: { customerId: customer.userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        cartTotal: true,
        createdAt: true,
      },
    });

    // Fetch wishlist preview (last 4)
    const wishlistPreview = await db.wishlist.findMany({
      where: { customerId: customer.userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            primaryImage: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    });

    // Count pending reviews
    const pendingReviewCount = await db.review.count({
      where: {
        customerId: customer.userId,
        status: "pending",
      },
    });

    // Total orders count
    const totalOrders = await db.order.count({
      where: { customerId: customer.userId },
    });

    // Wishlist total count
    const wishlistCount = await db.wishlist.count({
      where: { customerId: customer.userId },
    });

    return NextResponse.json({
      recentOrders,
      wishlistPreview,
      pendingReviewCount,
      totalOrders,
      wishlistCount,
    });
  } catch {
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}