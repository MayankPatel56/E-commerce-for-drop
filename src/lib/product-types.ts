/**
 * Shared product types used by both server components and API routes.
 * Keeping these in a plain .ts file (no "use client") lets server and
 * client components import them without bundling React into the client.
 */

export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
}

export interface ProductVariant {
  id: number;
  sku: string;
  variantType: string;
  variantValue: string;
  colorHex: string | null;
  price: number | null;
  stockQuantity: number;
  isOutOfStock: boolean;
}

export interface ProductTag {
  id: number;
  name: string;
}

export interface ProductReview {
  id: number;
  rating: number;
  title: string | null;
  comment: string | null;
  photoUrl: string | null;
  reviewedAt: string;
  customerName: string;
}

export interface ProductBundleOffer {
  quantity: number;
  label: string;
  price: number;
  compareAtPrice: number | null;
  badge: string | null;
}

export interface ProductFeature {
  icon: string;
  label: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  badgeText: string | null;
  soldLabel: string | null;
  videoUrl: string | null;
  features: ProductFeature[];
  bundleOffers: ProductBundleOffer[];
  primaryImage: string | null;
  galleryImages: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  category: ProductCategory | null;
  variants: ProductVariant[];
  variantTypes: Record<
    string,
    {
      value: string;
      variantId: number;
      colorHex: string | null;
      price: number | null;
      stockQuantity: number;
      isOutOfStock: boolean;
    }[]
  >;
  tags: ProductTag[];
  reviews: ProductReview[];
  averageRating: number;
  reviewCount: number;
  createdAt: string;
  inStock: boolean;
}