import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

// ─── Date Range Helpers ───────────────────────────────────────────────────────

function getDateRange(range: string, start?: string, end?: string) {
  const now = new Date();

  switch (range) {
    case "today": {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { gte: todayStart, lte: now };
    }
    case "last7days": {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      return { gte: sevenDaysAgo, lte: now };
    }
    case "last30days": {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);
      return { gte: thirtyDaysAgo, lte: now };
    }
    case "custom": {
      if (!start || !end) {
        return null;
      }
      const startDate = new Date(start);
      const endDate = new Date(end);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return null;
      }
      return { gte: startDate, lte: endDate };
    }
    default: {
      // Default to last 30 days
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);
      return { gte: thirtyDaysAgo, lte: now };
    }
  }
}

// ─── GET: Analytics dashboard data ────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "last30days";
    const start = searchParams.get("start") || undefined;
    const end = searchParams.get("end") || undefined;

    const dateFilter = getDateRange(range, start, end);
    if (!dateFilter) {
      return NextResponse.json(
        { error: "Invalid date range. Provide valid 'start' and 'end' for custom range." },
        { status: 400 }
      );
    }

    const orderWhere = { createdAt: dateFilter };

    // Run all queries in parallel
    const [
      totalOrders,
      revenueResult,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      confirmedOrders,
      shippedOrders,
      totalCustomers,
      subscribers,
      totalReviews,
      approvedReviews,
      pendingReviews,
      // For repeat purchase rate: customers with >1 order
      customersWithMultipleOrders,
      customersWithOrders,
    ] = await Promise.all([
      // Total orders in range
      db.order.count({ where: orderWhere }),

      // Revenue: sum of cartTotal excluding cancelled
      db.order.aggregate({
        where: { ...orderWhere, status: { not: "cancelled" } },
        _sum: { cartTotal: true },
        _count: true,
      }),

      // Status counts
      db.order.count({ where: { ...orderWhere, status: "pending" } }),
      db.order.count({ where: { ...orderWhere, status: "delivered" } }),
      db.order.count({ where: { ...orderWhere, status: "cancelled" } }),
      db.order.count({ where: { ...orderWhere, status: "confirmed" } }),
      db.order.count({ where: { ...orderWhere, status: "shipped" } }),

      // Total customers (global, not date-filtered)
      db.customer.count(),

      // Subscribers
      db.customer.count({ where: { emailConsentGiven: true } }),

      // Review counts (global, not date-filtered)
      db.review.count(),
      db.review.count({ where: { status: "approved" } }),
      db.review.count({ where: { status: "pending" } }),

      // Repeat purchase: customers with more than 1 order (non-cancelled)
      db.order.groupBy({
        by: ["customerId"],
        where: {
          customerId: { not: null },
          status: { not: "cancelled" },
        },
        having: { count: { id: { gt: 1 } } },
        _count: { id: true },
      }),

      // Total unique customers with any orders (non-cancelled)
      db.order.groupBy({
        by: ["customerId"],
        where: {
          customerId: { not: null },
          status: { not: "cancelled" },
        },
        _count: { id: true },
      }),
    ]);

    // Calculate derived metrics
    const revenue = revenueResult._sum.cartTotal ?? 0;
    const nonCancelledOrders =
      confirmedOrders + shippedOrders + deliveredOrders + pendingOrders;
    const codVerificationRate =
      nonCancelledOrders > 0
        ? ((confirmedOrders + shippedOrders + deliveredOrders) / nonCancelledOrders) * 100
        : 0;

    const avgOrderValue =
      revenueResult._count > 0 ? revenue / revenueResult._count : 0;

    const repeatPurchaseRate =
      customersWithOrders.length > 0
        ? (customersWithMultipleOrders.length / customersWithOrders.length) * 100
        : 0;

    return NextResponse.json({
      totalOrders,
      revenue,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      codVerificationRate: Math.round(codVerificationRate * 100) / 100,
      totalCustomers,
      subscribers,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      repeatPurchaseRate: Math.round(repeatPurchaseRate * 100) / 100,
      totalReviews,
      approvedReviews,
      pendingReviews,
    });
  } catch (err) {
    console.error("GET /api/admin/analytics error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}