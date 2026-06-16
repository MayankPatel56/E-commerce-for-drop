import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-auth";

/**
 * DELETE /api/customer/wishlist/[productId]
 * Remove product from wishlist
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { error, customer } = await requireCustomer();
  if (error) return error;

  try {
    const { productId: productIdStr } = await params;
    const productId = parseInt(productIdStr, 10);
    if (isNaN(productId)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    await db.wishlist.delete({
      where: {
        customerId_productId: {
          customerId: customer.userId,
          productId,
        },
      },
    }).catch(() => null);

    return NextResponse.json({ success: true, message: "Removed from wishlist" });
  } catch {
    return NextResponse.json({ error: "Failed to remove from wishlist" }, { status: 500 });
  }
}