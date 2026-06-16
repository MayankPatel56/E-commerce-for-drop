import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-auth";

/**
 * GET /api/customer/export-data
 * DPDP Act compliance — export all customer data as downloadable JSON.
 * Includes: customer profile, orders with items, reviews, wishlist items.
 */
export async function GET() {
  const { error, customer } = await requireCustomer();
  if (error) return error;

  try {
    // Fetch all related data in parallel
    const [customerRecord, orders, reviews, wishlist] = await Promise.all([
      db.customer.findUnique({
        where: { id: customer.userId },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          address: true,
          role: true,
          isRegistered: true,
          emailConsentGiven: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      db.order.findMany({
        where: { customerId: customer.userId },
        orderBy: { createdAt: "desc" },
        include: {
          orderItems: {
            include: {
              variant: {
                select: {
                  sku: true,
                  variantType: true,
                  variantValue: true,
                  product: {
                    select: { name: true, slug: true },
                  },
                },
              },
            },
          },
        },
      }),
      db.review.findMany({
        where: { customerId: customer.userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          productId: true,
          rating: true,
          title: true,
          comment: true,
          photoUrl: true,
          status: true,
          createdAt: true,
        },
      }),
      db.wishlist.findMany({
        where: { customerId: customer.userId },
        orderBy: { createdAt: "desc" },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              primaryImage: true,
            },
          },
        },
      }),
    ]);

    const data = {
      exportedAt: new Date().toISOString(),
      customer: customerRecord,
      orders,
      reviews,
      wishlist,
    };

    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    headers.set(
      "Content-Disposition",
      `attachment; filename="indicore-data-${customer.userId}.json"`
    );
    return new Response(JSON.stringify(data, null, 2), { headers });
  } catch {
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
