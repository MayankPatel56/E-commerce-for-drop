import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-auth";

/**
 * DELETE /api/customer/delete-account
 * Permanently delete the customer's account and all associated data.
 * - Wishlist items and reviews are deleted explicitly.
 * - Deleting the User record cascades to the Customer record.
 * - Orders survive because customerId is nullable.
 */
export async function DELETE() {
  const { error, customer } = await requireCustomer();
  if (error) return error;

  try {
    // 1. Delete wishlist items
    await db.wishlist.deleteMany({
      where: { customerId: customer.userId },
    });

    // 2. Delete reviews (non-optional customerId foreign key)
    await db.review.deleteMany({
      where: { customerId: customer.userId },
    });

    // 3. Delete User — cascades to Customer (onDelete: Cascade)
    await db.user.delete({
      where: { id: customer.userId },
    });

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
