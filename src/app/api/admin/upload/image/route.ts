import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { processUploadedImage } from "@/lib/image-processing";

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const formData = await request.formData();
    const file = formData.get("image");

    console.log("=== IMAGE UPLOAD START ===");
    console.log("File exists:", !!file);

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No image file provided. Expected form field 'image'." },
        { status: 400 }
      );
    }

    console.log("File name:", file.name);
    console.log("File size:", file.size);
    console.log("File type:", file.type);

    const { galleryUrl, thumbnailUrl } = await processUploadedImage(file);

    console.log("Gallery URL:", galleryUrl);
    console.log("Thumbnail URL:", thumbnailUrl);
    console.log("=== IMAGE UPLOAD SUCCESS ===");

    return NextResponse.json(
      { galleryUrl, thumbnailUrl },
      { status: 201 }
    );
  } catch (err) {
    console.error("================================");
    console.error("IMAGE UPLOAD ERROR");
    console.error(err);
    console.error(
      err instanceof Error ? err.stack : "No stack trace available"
    );
    console.error("================================");

    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}