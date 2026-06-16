import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/settings
 * Return all public settings as a flat key-value map.
 * No authentication required — these are storefront-level settings.
 */
export async function GET() {
  try {
    const settings = await db.setting.findMany();
    const settingsMap: Record<string, unknown> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }
    return NextResponse.json(settingsMap);
  } catch {
    return NextResponse.json(
      { error: "Failed to load settings" },
      { status: 500 }
    );
  }
}
