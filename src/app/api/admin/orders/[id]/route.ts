import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * GET /api/admin/orders/[id]
 * Admin order detail with full information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: {
            name: true,
            email: true,
            phone: true,
            isRegistered: true,
          },
        },
        orderItems: {
          include: {
            variant: {
              include: {
                product: { select: { name: true, slug: true, primaryImage: true } },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const shippingAddress = JSON.parse(order.shippingAddress) as Record<string, string>;

    return NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      cartTotal: order.cartTotal,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      consentGiven: order.consentGiven,
      internalNotes: order.internalNotes,
      shippingAddress,
      customer: order.customer,
      items: order.orderItems.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.unitPrice * item.quantity,
        variantSnapshot: item.variantSnapshot ? JSON.parse(item.variantSnapshot) : null,
        variant: item.variant
          ? {
              id: item.variant.id,
              sku: item.variant.sku,
              variantType: item.variant.variantType,
              variantValue: item.variant.variantValue,
              product: item.variant.product,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error("GET /api/admin/orders/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}