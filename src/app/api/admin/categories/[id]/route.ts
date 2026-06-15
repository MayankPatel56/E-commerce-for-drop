import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { generateSlug } from "@/lib/slug";
import { z } from "zod";

// ─── Validation Schema ────────────────────────────────────────────────────────

const updateCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

// ─── Slug Collision Handler ───────────────────────────────────────────────────

async function generateUniqueCategorySlug(name: string, excludeId?: number): Promise<string> {
  const base = generateSlug(name);
  const existing = await db.category.findMany({
    where: { slug: { startsWith: base }, id: excludeId ? { not: excludeId } : undefined },
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

// ─── PUT: Update category ─────────────────────────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    const categoryId = parseInt(id, 10);
    if (isNaN(categoryId)) {
      return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
    }

    const existing = await db.category.findUnique({ where: { id: categoryId } });
    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name } = parsed.data;

    // Check name uniqueness (excluding current)
    const nameConflict = await db.category.findFirst({
      where: { name, id: { not: categoryId } },
    });
    if (nameConflict) {
      return NextResponse.json(
        { error: "Category name already exists" },
        { status: 409 }
      );
    }

    const slug = await generateUniqueCategorySlug(name, categoryId);

    const category = await db.category.update({
      where: { id: categoryId },
      data: { name, slug },
    });

    return NextResponse.json(category);
  } catch (err) {
    console.error("PUT /api/admin/categories/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE: Delete category ──────────────────────────────────────────────────

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    const categoryId = parseInt(id, 10);
    if (isNaN(categoryId)) {
      return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
    }

    const existing = await db.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: { select: { products: true } },
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Check if any products use this category
    if (existing._count.products > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete category with products",
          details: { productCount: existing._count.products },
        },
        { status: 409 }
      );
    }

    await db.category.delete({ where: { id: categoryId } });

    return NextResponse.json({ message: "Category deleted" });
  } catch (err) {
    console.error("DELETE /api/admin/categories/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}