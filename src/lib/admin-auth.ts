import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
 * Helper: return admin session or null. Call at the top of admin pages/handlers.
 * The caller (page component) should redirect if null.
 */
export async function requireAdmin() {
  const admin = await getAdminSession();
  return admin ?? null;
}