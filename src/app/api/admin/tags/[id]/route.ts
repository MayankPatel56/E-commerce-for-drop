import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { z } from "zod";

// ─── Validation Schema ────────────────────────────────────────────────────────

const updateTagSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
});

// ─── PUT: Update tag ──────────────────────────────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    const tagId = parseInt(id, 10);
    if (isNaN(tagId)) {
      return NextResponse.json({ error: "Invalid tag ID" }, { status: 400 });
    }

    const existing = await db.tag.findUnique({ where: { id: tagId } });
    if (!existing) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateTagSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name } = parsed.data;

    // Check uniqueness (excluding current)
    const nameConflict = await db.tag.findFirst({
      where: { name, id: { not: tagId } },
    });
    if (nameConflict) {
      return NextResponse.json(
        { error: "Tag name already exists" },
        { status: 409 }
      );
    }

    const tag = await db.tag.update({
      where: { id: tagId },
      data: { name },
    });

    return NextResponse.json(tag);
  } catch (err) {
    console.error("PUT /api/admin/tags/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE: Delete tag ───────────────────────────────────────────────────────

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    const tagId = parseInt(id, 10);
    if (isNaN(tagId)) {
      return NextResponse.json({ error: "Invalid tag ID" }, { status: 400 });
    }

    const existing = await db.tag.findUnique({ where: { id: tagId } });
    if (!existing) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    await db.tag.delete({ where: { id: tagId } });

    return NextResponse.json({ message: "Tag deleted" });
  } catch (err) {
    console.error("DELETE /api/admin/tags/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}