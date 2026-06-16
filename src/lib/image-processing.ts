import sharp from "sharp";
import { generateImageFilename } from "@/lib/slug";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products");
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

interface ProcessedImage {
  galleryUrl: string;
  thumbnailUrl: string;
}

/**
 * Process an uploaded image file:
 * 1. Validate MIME type and size
 * 2. Resize to max 1200px (gallery) and 600px (thumbnail)
 * 3. Convert to WebP (quality 80)
 * 4. Save to public/uploads/products/
 * 5. Return public URLs
 *
 * Plan Reference: Phase 2 Image Upload Requirements
 */
export async function processUploadedImage(
  file: File
): Promise<ProcessedImage> {
  // Validate MIME type (server-side, never trust client)
  const mimeType = file.type;
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error("Invalid file type. Accepted: JPG, JPEG, PNG, WebP");
  }

  // Validate size
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("File too large. Maximum size is 5MB");
  }

  // Ensure upload directory exists
  await mkdir(UPLOAD_DIR, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const baseName = generateImageFilename(file.name).replace(/\.[^.]+$/, "");

  // Process gallery image (max 1200px wide)
  const galleryBuffer = await sharp(buffer)
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const galleryFilename = `${baseName}-gallery.webp`;
  const galleryPath = path.join(UPLOAD_DIR, galleryFilename);
  await writeFile(galleryPath, galleryBuffer);

  // Process thumbnail (max 600px wide)
  const thumbnailBuffer = await sharp(buffer)
    .resize({ width: 600, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const thumbnailFilename = `${baseName}-thumb.webp`;
  const thumbnailPath = path.join(UPLOAD_DIR, thumbnailFilename);
  await writeFile(thumbnailPath, thumbnailBuffer);

  return {
    galleryUrl: `/uploads/products/${galleryFilename}`,
    thumbnailUrl: `/uploads/products/${thumbnailFilename}`,
  };
}