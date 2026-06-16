import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { z } from "zod";

// ─── Validation Schema ────────────────────────────────────────────────────────

const updateHomepageSchema = z.object({
  heroBanner: z.unknown().optional(),
  featuredProductIds: z.array(z.number()).optional(),
  categoriesSection: z.unknown().optional(),
  whyChooseUs: z.array(z.record(z.unknown())).optional(),
  customerReviews: z.record(z.unknown()).optional(),
  footer: z.unknown().optional(),
});

// ─── GET: Fetch homepage content (singleton id=1) ────────────────────────────

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const content = await db.homepageContent.findUnique({ where: { id: 1 } });

    if (!content) {
      return NextResponse.json(
        { error: "Homepage content not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(content);
  } catch (err) {
    console.error("GET /api/admin/homepage error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── PUT: Update homepage content (singleton id=1) ───────────────────────────

export async function PUT(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = updateHomepageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const content = await db.homepageContent.upsert({
      where: { id: 1 },
      update: {
        ...data,
        updatedAt: new Date(),
      },
      create: {
        id: 1,
        ...data,
        customerReviews: (data.customerReviews as Record<string, unknown>) ?? {
          max_reviews_to_show: 6,
        },
      },
    });

    return NextResponse.json(content);
  } catch (err) {
    console.error("PUT /api/admin/homepage error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}