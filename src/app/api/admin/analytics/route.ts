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

    // Run queries sequentially to prevent connection pool exhaustion and timeouts
    // when connection_limit is set to a low value (like 1).

    // 1. Group order stats by status to reduce 7 count/sum queries into 1
    const orderMetrics = await db.order.groupBy({
      by: ["status"],
      where: orderWhere,
      _count: { id: true },
      _sum: { cartTotal: true },
    });

    let totalOrders = 0;
    let revenue = 0;
    let pendingOrders = 0;
    let deliveredOrders = 0;
    let cancelledOrders = 0;
    let confirmedOrders = 0;
    let shippedOrders = 0;
    let nonCancelledOrders = 0;

    for (const metric of orderMetrics) {
      const count = metric._count.id;
      totalOrders += count;

      if (metric.status !== "cancelled") {
        revenue += metric._sum.cartTotal ?? 0;
        nonCancelledOrders += count;
      }

      if (metric.status === "pending") pendingOrders = count;
      else if (metric.status === "delivered") deliveredOrders = count;
      else if (metric.status === "cancelled") cancelledOrders = count;
      else if (metric.status === "confirmed") confirmedOrders = count;
      else if (metric.status === "shipped") shippedOrders = count;
    }

    // 2. Group review stats by status to reduce 3 count queries into 1
    const reviewMetrics = await db.review.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    let totalReviews = 0;
    let approvedReviews = 0;
    let pendingReviews = 0;

    for (const metric of reviewMetrics) {
      const count = metric._count.id;
      totalReviews += count;

      if (metric.status === "approved") approvedReviews = count;
      else if (metric.status === "pending") pendingReviews = count;
    }

    // 3. Count total customers
    const totalCustomers = await db.customer.count();

    // 4. Count subscribers
    const subscribers = await db.customer.count({
      where: { emailConsentGiven: true },
    });

    // 5. Repeat purchase: group by customerId to find repeat purchase rate
    const customerOrderCounts = await db.order.groupBy({
      by: ["customerId"],
      where: {
        customerId: { not: null },
        status: { not: "cancelled" },
        ...orderWhere,
      },
      _count: { id: true },
    });

    // Calculate derived metrics
    const avgOrderValue =
      nonCancelledOrders > 0 ? revenue / nonCancelledOrders : 0;

    const codVerificationRate =
      nonCancelledOrders > 0
        ? ((confirmedOrders + shippedOrders + deliveredOrders) / nonCancelledOrders) * 100
        : 0;

    // Repeat purchase: customers with more than 1 order in the date range
    const customersWithMultipleOrders = customerOrderCounts.filter(
      (g) => g._count.id > 1
    ).length;
    const customersWithOrders = customerOrderCounts.length;

    const repeatPurchaseRate =
      customersWithOrders > 0
        ? (customersWithMultipleOrders / customersWithOrders) * 100
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
    // Detailed logging to help debug
    console.error("GET /api/admin/analytics error:", err);
    // Optionally, return the error message in development
    return NextResponse.json(
      { error: "Internal server error", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}