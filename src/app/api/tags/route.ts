import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/tags — Public tag listing
 * Returns tags with product count for multi-tag filtering
 */
export async function GET() {
  try {
    const tags = await db.tag.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            productTags: {
              where: {
                product: { isPublished: true },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      tags.map((t) => ({
        id: t.id,
        name: t.name,
        productCount: t._count.productTags,
      }))
    );
  } catch (error) {
    console.error("GET /api/tags error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}