import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { z } from "zod";

// ─── Validation Schema ────────────────────────────────────────────────────────

const createTagSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
});

// ─── GET: List all tags ───────────────────────────────────────────────────────

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const tags = await db.tag.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { productTags: true },
        },
      },
    });

    const formatted = tags.map((t) => ({
      id: t.id,
      name: t.name,
      productCount: t._count.productTags,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("GET /api/admin/tags error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST: Create tag ─────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const parsed = createTagSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name } = parsed.data;

    // Check uniqueness
    const existing = await db.tag.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json(
        { error: "Tag name already exists" },
        { status: 409 }
      );
    }

    const tag = await db.tag.create({ data: { name } });

    return NextResponse.json(tag, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/tags error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}