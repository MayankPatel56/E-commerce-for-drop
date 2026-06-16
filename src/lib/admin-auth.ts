import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

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