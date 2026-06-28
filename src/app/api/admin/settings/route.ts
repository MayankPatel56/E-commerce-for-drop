import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { z } from "zod";

// ─── Validation Schema ────────────────────────────────────────────────────────

const upsertSettingSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.unknown(),
});

// ─── GET: Return all settings as key-value pairs ──────────────────────────────

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const settings = await db.setting.findMany();
    const kv: Record<string, unknown> = {};
    for (const s of settings) {
      kv[s.key] = s.value;
    }

    return NextResponse.json({ settings: kv });
  } catch (err) {
    console.error("GET /api/admin/settings error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── PUT: Upsert a single setting ─────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = upsertSettingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { key, value } = parsed.data;

    const setting = await db.setting.upsert({
      where: { key },
      update: { value: value as object },
      create: { key, value: value as object },
    });

    return NextResponse.json(setting);
  } catch (err) {
    console.error("PUT /api/admin/settings error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}