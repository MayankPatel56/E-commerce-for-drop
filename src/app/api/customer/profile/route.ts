import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-auth";
import { z } from "zod";

const addressSchema = z.object({
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit pincode"),
});

const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  phone: z.string().regex(/^[0-9]{10}$/, "Enter a valid 10-digit phone number").optional(),
  address: addressSchema.optional(),
  withdrawConsent: z.boolean().optional(),
});

/**
 * GET /api/customer/profile
 * Returns customer profile without password_hash
 */
export async function GET() {
  const { error, customer } = await requireCustomer();
  if (error) return error;

  try {
    const profile = await db.customer.findUnique({
      where: { id: customer.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        address: true,
        isRegistered: true,
        emailConsentGiven: true,
        createdAt: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Customer profile not found" }, { status: 404 });
    }

    // Prisma Json type: already parsed
    const parsedAddress = profile.address || null;

    return NextResponse.json({
      ...profile,
      address: parsedAddress,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

/**
 * PUT /api/customer/profile
 * Update name, phone, address (with State), consent withdrawal
 */
export async function PUT(request: NextRequest) {
  const { error, customer } = await requireCustomer();
  if (error) return error;

  try {
    const body = await request.json();
    const result = updateProfileSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, phone, address, withdrawConsent } = result.data;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (withdrawConsent === true) updateData.emailConsentGiven = false;

    const updated = await db.customer.update({
      where: { id: customer.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        address: true,
        isRegistered: true,
        emailConsentGiven: true,
        createdAt: true,
      },
    });

    const parsedAddress = updated.address || null;

    return NextResponse.json({
      ...updated,
      address: parsedAddress,
    });
  } catch {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}