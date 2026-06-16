import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
  phone: z
    .string()
    .regex(/^[0-9]{10}$/, "Enter a valid 10-digit phone number"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { name, email, password, phone } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists as a registered User
    const existingUser = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if there's a guest Customer with this email (for account linking)
    const guestCustomer = await db.customer.findUnique({
      where: { email: normalizedEmail },
    });

    let linkedOrders = 0;

    if (guestCustomer && !guestCustomer.isRegistered) {
      // Guest-to-registered account linking (Phase 5)
      // 1. Delete the old guest User (placeholder password) and Customer
      // 2. Create new User with real password, reusing the same Customer ID
      const guestUserId = guestCustomer.id;

      await db.$transaction(async (tx) => {
        // Delete the placeholder User
        await tx.user.delete({ where: { id: guestUserId } });

        // Create new User with the same ID (so the existing Customer relation stays intact)
        await tx.user.create({
          data: {
            id: guestUserId,
            email: normalizedEmail,
            name,
            password: hashedPassword,
          },
        });

        // Update the Customer to registered status
        await tx.customer.update({
          where: { id: guestUserId },
          data: {
            name,
            phone,
            isRegistered: true,
          },
        });

        // Count linked orders
        linkedOrders = await tx.order.count({
          where: { customerId: guestUserId },
        });
      });

      return NextResponse.json({
        success: true,
        user: {
          id: guestCustomer.id,
          email: normalizedEmail,
          name,
          role: "customer",
        },
        message: linkedOrders > 0
          ? `Account created successfully. ${linkedOrders} existing order(s) linked to your account.`
          : "Account created successfully. Please sign in.",
        linkedOrders,
      });
    }

    // Normal registration: no existing guest account
    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name,
        customer: {
          create: {
            email: normalizedEmail,
            name,
            phone,
            role: "customer",
            isRegistered: true,
            emailConsentGiven: false,
          },
        },
      },
      include: { customer: true },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.customer.name,
        role: user.customer.role,
      },
      message: "Account created successfully. Please sign in.",
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}