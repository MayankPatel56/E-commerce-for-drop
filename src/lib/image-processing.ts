import sharp from "sharp";
import { generateImageFilename } from "@/lib/slug";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET_NAME = "product-images";
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

interface ProcessedImage {
  galleryUrl: string;
  thumbnailUrl: string;
}

export async function processUploadedImage(file: File): Promise<ProcessedImage> {
  const mimeType = file.type;
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error("Invalid file type. Accepted: JPG, JPEG, PNG, WebP");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("File too large. Maximum size is 5MB");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const baseName = generateImageFilename(file.name).replace(/\.[^.]+$/, "");

  // Gallery (1200px)
  const galleryBuffer = await sharp(buffer)
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
  const galleryFilename = `${baseName}-gallery.webp`;

  const { error: galleryError } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(galleryFilename, galleryBuffer, {
      contentType: "image/webp",
      upsert: false,
    });
  if (galleryError) throw new Error(`Gallery upload failed: ${galleryError.message}`);

  // Thumbnail (600px)
  const thumbnailBuffer = await sharp(buffer)
    .resize({ width: 600, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
  const thumbnailFilename = `${baseName}-thumb.webp`;

  const { error: thumbError } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(thumbnailFilename, thumbnailBuffer, {
      contentType: "image/webp",
      upsert: false,
    });
  if (thumbError) throw new Error(`Thumbnail upload failed: ${thumbError.message}`);

  const { data: galleryUrlData } = supabaseAdmin.storage
    .from(BUCKET_NAME)
    .getPublicUrl(galleryFilename);
  const { data: thumbUrlData } = supabaseAdmin.storage
    .from(BUCKET_NAME)
    .getPublicUrl(thumbnailFilename);

  return {
    galleryUrl: galleryUrlData.publicUrl,
    thumbnailUrl: thumbUrlData.publicUrl,
  };
}