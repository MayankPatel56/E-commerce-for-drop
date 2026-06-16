import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import sharp from "sharp";
import { generateImageFilename } from "@/lib/slug";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// ─── Constants ────────────────────────────────────────────────────────────────

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products");
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// ─── POST: Upload and process an image ────────────────────────────────────────

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const formData = await request.formData();
    const file = formData.get("image");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No image file provided. Use 'image' field." },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Accepted: JPG, JPEG, PNG, WebP, GIF",
        },
        { status: 400 }
      );
    }

    // Validate size
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const baseName = generateImageFilename(file.name).replace(/\.[^.]+$/, "");

    // Process image: resize to max 1200px width, convert to WebP
    const processedBuffer = await sharp(buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const filename = `${baseName}.webp`;
    const filePath = path.join(UPLOAD_DIR, filename);
    await writeFile(filePath, processedBuffer);

    const url = `/uploads/products/${filename}`;

    return NextResponse.json({ url }, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/upload/image error:", err);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}