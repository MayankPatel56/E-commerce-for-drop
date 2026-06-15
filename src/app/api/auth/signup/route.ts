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

    // Check if email already exists
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User (auth layer) + Customer (business layer) in transaction
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        customer: {
          create: {
            email,
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