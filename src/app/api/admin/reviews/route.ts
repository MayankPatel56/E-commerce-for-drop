import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { z } from "zod";

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

// ─── POST: Create review (admin-added, linked to customer or display name) ───

const createReviewSchema = z.object({
  productId: z.number().int().positive(),
  customerId: z.string().optional().nullable(),
  displayName: z.string().min(1).max(100).optional().nullable(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(150).optional().nullable(),
  comment: z.string().max(2000).optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  status: z.enum(["pending", "approved", "rejected", "hidden"]).optional().default("approved"),
}).refine(
  (data) => data.customerId || data.displayName,
  { message: "Either customerId or displayName is required" }
);

/**
 * POST /api/admin/reviews
 * Admin-created review — either linked to a real customer or a display-only name
 */
export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = createReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const product = await db.product.findUnique({ where: { id: data.productId } });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (data.customerId) {
      const customer = await db.customer.findUnique({ where: { id: data.customerId } });
      if (!customer) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }
    }

    const review = await db.review.create({
      data: {
        productId: data.productId,
        customerId: data.customerId ?? null,
        displayName: data.customerId ? null : data.displayName,
        rating: data.rating,
        title: data.title ?? null,
        comment: data.comment ?? null,
        photoUrl: data.photoUrl ?? null,
        status: data.status,
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        product: { select: { id: true, name: true, slug: true, primaryImage: true } },
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/reviews error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}