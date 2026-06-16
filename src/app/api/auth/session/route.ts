import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * Get the current authenticated session with role information.
 * Used by frontend to determine auth state and role-based redirect.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 }
      );
    }

    const user = session.user as Record<string, unknown>;
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch {
    return NextResponse.json(
      { authenticated: false, user: null, error: "Session check failed" },
      { status: 500 }
    );
  }
}