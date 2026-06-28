import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Admin password policy: minimum 16 characters (Plan: Phase 9 §Security Hardening).
 * Use this schema when creating or changing admin passwords.
 * Seed enforcement: admin account uses "IndicoreAdmin2024!Secure" (22 chars).
 */
export const adminPasswordSchema = z
  .string()
  .min(16, "Admin password must be at least 16 characters")
  .max(128, "Password must not exceed 128 characters");

/**
 * Server-side admin authentication check.
 * Use in all /api/admin/* routes to verify the caller is an admin.
 * Returns { userId, email } on success, or null on failure.
 */
export async function getAdminSession(): Promise<{
  userId: string;
  email: string;
  name: string;
} | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const user = session.user as Record<string, unknown>;
  if (user.role !== "admin") return null;

  return {
    userId: user.id as string,
    email: user.email as string,
    name: user.name as string,
  };
}

/**
 * Helper: return 401 if not admin. Call at the top of every admin API route.
 */
export async function requireAdmin() {
  const admin = await getAdminSession();
  if (!admin) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), admin: null };
  }
  return { error: null, admin };
}