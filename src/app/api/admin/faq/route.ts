import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { z } from "zod";

// ─── Validation Schema ────────────────────────────────────────────────────────

const createFaqSchema = z.object({
  question: z.string().min(1, "Question is required").max(500),
  answer: z.string().min(1, "Answer is required").max(5000),
  displayOrder: z.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

// ─── GET: List all FAQs with optional search ──────────────────────────────────

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { question: { contains: search } },
        { answer: { contains: search } },
      ];
    }

    const faqs = await db.faq.findMany({
      where,
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json({ faqs });
  } catch (err) {
    console.error("GET /api/admin/faq error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── POST: Create a new FAQ ──────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = createFaqSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const faq = await db.faq.create({
      data: {
        question: parsed.data.question,
        answer: parsed.data.answer,
        displayOrder: parsed.data.displayOrder,
        isActive: parsed.data.isActive,
      },
    });

    return NextResponse.json(faq, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/faq error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}