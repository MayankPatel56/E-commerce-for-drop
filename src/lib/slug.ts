/**
 * Generate a URL-friendly slug from a name string.
 * Handles collision by appending counter (e.g., "my-product-2").
 * Plan Reference: §Phase 2 slug uniqueness
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Generate a unique filename for uploaded images.
 */
export function generateImageFilename(originalName: string): string {
  const ext = originalName.split(".").pop()?.toLowerCase() || "webp";
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}.${ext}`;
}