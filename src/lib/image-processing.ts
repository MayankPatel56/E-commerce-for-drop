import sharp from "sharp";
import { generateImageFilename } from "@/lib/slug";
import { createClient } from "@supabase/supabase-js";

// Safe fallback so a missing NEXT_PUBLIC_SUPABASE_URL never produces an
// undefined URL at runtime (which would crash the Supabase client).
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://gefenowenqvlhbrfnibl.supabase.co";

const BUCKET_NAME = "product-images";
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// Lazy-initialized Supabase client — created on first use so missing env vars
// don't crash the build (module load time). This avoids "Failed to collect page data"
// errors during static generation when SUPABASE_SERVICE_ROLE_KEY is not set.
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
    }
    supabaseAdmin = createClient(SUPABASE_URL, serviceRoleKey);
  }
  return supabaseAdmin;
}

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

  const { error: galleryError } = await getSupabaseAdmin().storage
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

  const { error: thumbError } = await getSupabaseAdmin().storage
    .from(BUCKET_NAME)
    .upload(thumbnailFilename, thumbnailBuffer, {
      contentType: "image/webp",
      upsert: false,
    });
  if (thumbError) throw new Error(`Thumbnail upload failed: ${thumbError.message}`);

  const { data: galleryUrlData } = getSupabaseAdmin().storage
    .from(BUCKET_NAME)
    .getPublicUrl(galleryFilename);
  const { data: thumbUrlData } = getSupabaseAdmin().storage
    .from(BUCKET_NAME)
    .getPublicUrl(thumbnailFilename);

  return {
    galleryUrl: galleryUrlData.publicUrl,
    thumbnailUrl: thumbUrlData.publicUrl,
  };
}