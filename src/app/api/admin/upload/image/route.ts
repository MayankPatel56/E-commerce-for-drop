import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { processUploadedImage } from "@/lib/image-processing";

/**
 * POST /api/admin/upload/image
 * Admin-only image upload endpoint
 * Accepts FormData with "image" file field
 * Returns { url, thumbnailUrl }
 */
export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided. Use field name 'image'." },
        { status: 400 }
      );
    }

    const processed = await processUploadedImage(file);

    return NextResponse.json(
      {
        url: processed.galleryUrl,
        thumbnailUrl: processed.thumbnailUrl,
      },
      { status: 201 }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to upload image";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}