import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { processUploadedImage } from "@/lib/image-processing";

// ─── POST: Upload and process image ───────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided. Use field name 'image'." },
        { status: 400 }
      );
    }

    const result = await processUploadedImage(file);

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("POST /api/admin/upload/image error:", err);

    // Return 400 for known validation errors, 500 for unexpected
    if (
      message.includes("Invalid file type") ||
      message.includes("too large")
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}