import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/faq — Public FAQ listing
 * Returns active FAQs ordered by displayOrder
 */
export async function GET() {
  try {
    const faqs = await db.faq.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
      select: {
        id: true,
        question: true,
        answer: true,
        displayOrder: true,
      },
    });

    return NextResponse.json(faqs);
  } catch (error) {
    console.error("GET /api/faq error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}