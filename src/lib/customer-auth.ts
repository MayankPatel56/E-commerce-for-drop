import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Server-side customer authentication check.
 * Use in all /api/customer/* routes to verify the caller is an authenticated customer.
 */
export async function getCustomerSession(): Promise<{
  userId: string;
  email: string;
  name: string;
} | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const user = session.user as Record<string, unknown>;
  return {
    userId: user.id as string,
    email: user.email as string,
    name: (user.name as string) || "",
  };
}

/**
 * Helper: return 401 if not authenticated. Call at the top of every customer API route.
 */
export async function requireCustomer() {
  const customer = await getCustomerSession();
  if (!customer) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), customer: null };
  }
  return { error: null, customer };
}