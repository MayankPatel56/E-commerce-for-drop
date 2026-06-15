import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { checkLoginRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // Check rate limiting (database-based, no Redis)
    const rateLimit = await checkLoginRateLimit(email);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Account locked due to too many failed attempts. Please try again in ${rateLimit.remainingMinutes} minutes.`,
          code: "ACCOUNT_LOCKED",
          remainingMinutes: rateLimit.remainingMinutes,
        },
        { status: 429 }
      );
    }

    // Find user with customer profile
    const user = await db.user.findUnique({
      where: { email },
      include: { customer: true },
    });

    if (!user || !user.customer) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Failed attempt handled by NextAuth authorize, but also handle here
      // for the custom login API
      const newAttempts = user.customer.loginAttempts + 1;
      if (newAttempts >= 5) {
        await db.customer.update({
          where: { id: user.id },
          data: {
            loginAttempts: newAttempts,
            lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
          },
        });
      } else {
        await db.customer.update({
          where: { id: user.id },
          data: { loginAttempts: newAttempts },
        });
      }

      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Reset login attempts on success
    await db.customer.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lockedUntil: null },
    });

    // Return user info — the actual NextAuth signIn is handled client-side
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.customer.name,
        role: user.customer.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}