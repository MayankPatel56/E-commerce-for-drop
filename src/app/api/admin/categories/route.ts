import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { generateSlug } from "@/lib/slug";
import { z } from "zod";

// ─── Validation Schema ────────────────────────────────────────────────────────

const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

// ─── Slug Collision Handler ───────────────────────────────────────────────────

async function generateUniqueCategorySlug(name: string): Promise<string> {
  const base = generateSlug(name);
  const existing = await db.category.findMany({
    where: { slug: { startsWith: base } },
    select: { slug: true },
  });

  if (!existing.some((c) => c.slug === base)) {
    return base;
  }

  let counter = 2;
  while (existing.some((c) => c.slug === `${base}-${counter}`)) {
    counter++;
  }
  return `${base}-${counter}`;
}

// ─── GET: List all categories ─────────────────────────────────────────────────

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const categories = await db.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    const formatted = categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      productCount: c._count.products,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("GET /api/admin/categories error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST: Create category ────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const parsed = createCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name } = parsed.data;

    // Check name uniqueness
    const existing = await db.category.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json(
        { error: "Category name already exists" },
        { status: 409 }
      );
    }

    const slug = await generateUniqueCategorySlug(name);

    const category = await db.category.create({
      data: { name, slug },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/categories error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}