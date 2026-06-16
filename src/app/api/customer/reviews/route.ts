import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-auth";

/**
 * GET /api/customer/reviews
 * Returns all reviews submitted by the authenticated customer
 */
export async function GET() {
  const { error, customer } = await requireCustomer();
  if (error) return error;

  try {
    const reviews = await db.review.findMany({
      where: { customerId: customer.userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            primaryImage: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reviews);
  } catch {
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}