import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/checkout/settings
 * Returns COD min/max values for checkout validation
 * Plan Reference: Phase 9 ISR — revalidate = 3600 (1 hour)
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await db.setting.findMany({
      where: {
        key: { in: ["cod_min_order", "cod_max_order"] },
      },
    });

    const settingsMap: Record<string, number> = {
      cod_min: 0,
      cod_max: 50000,
    };

    for (const s of settings) {
      const parsed = s.value as { value: number };
      if (s.key === "cod_min_order") {
        settingsMap.cod_min = parsed.value ?? 0;
      } else if (s.key === "cod_max_order") {
        settingsMap.cod_max = parsed.value ?? 50000;
      }
    }

    return NextResponse.json(settingsMap);
  } catch (error) {
    console.error("GET /api/checkout/settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}