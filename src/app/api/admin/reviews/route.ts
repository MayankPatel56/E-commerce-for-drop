import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * GET /api/admin/reviews
 * List reviews with filters (status, product, customer search)
 */
export async function GET(request: NextRequest) {
  const { error, admin } = await requireAdmin();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));

    const where: Record<string, unknown> = {};
    if (status && status !== "all") {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { customer: { name: { contains: search } } },
        { product: { name: { contains: search } } },
        { comment: { contains: search } } as Record<string, unknown>,
      ];
    }

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where,
        include: {
          customer: {
            select: { id: true, name: true, email: true },
          },
          product: {
            select: { id: true, name: true, slug: true, primaryImage: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.review.count({ where }),
    ]);

    // Count by status for filter badges
    const statusCounts = await db.review.groupBy({
      by: ["status"],
      _count: true,
    });

    const counts: Record<string, number> = {};
    for (const sc of statusCounts) {
      counts[sc.status] = sc._count;
    }

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      counts,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}