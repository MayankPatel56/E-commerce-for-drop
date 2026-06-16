import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { z } from "zod";

// ─── Validation Schema ────────────────────────────────────────────────────────

const updateFaqSchema = z.object({
  question: z.string().min(1).max(500).optional(),
  answer: z.string().min(1).max(5000).optional(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// ─── PUT: Update a FAQ by ID ──────────────────────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    const faqId = parseInt(id, 10);
    if (isNaN(faqId)) {
      return NextResponse.json({ error: "Invalid FAQ ID" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = updateFaqSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Check FAQ exists
    const existing = await db.faq.findUnique({ where: { id: faqId } });
    if (!existing) {
      return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
    }

    const faq = await db.faq.update({
      where: { id: faqId },
      data: parsed.data,
    });

    return NextResponse.json(faq);
  } catch (err) {
    console.error("PUT /api/admin/faq/[id] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── DELETE: Delete a FAQ by ID ───────────────────────────────────────────────

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    const faqId = parseInt(id, 10);
    if (isNaN(faqId)) {
      return NextResponse.json({ error: "Invalid FAQ ID" }, { status: 400 });
    }

    // Check FAQ exists
    const existing = await db.faq.findUnique({ where: { id: faqId } });
    if (!existing) {
      return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
    }

    await db.faq.delete({ where: { id: faqId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/admin/faq/[id] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}