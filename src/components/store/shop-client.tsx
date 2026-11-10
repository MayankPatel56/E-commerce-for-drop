"use client";

import { useRouter } from "next/navigation";
import { ProductListing } from "./product-listing";

interface Category {
  id: number;
  name: string;
  slug: string;
  productCount: number;
}

interface Tag {
  id: number;
  name: string;
  productCount: number;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  primaryImage: string | null;
  category: { name: string; slug: string } | null;
  inStock: boolean;
  reviewCount: number;
  averageRating: number;
  tags: { id: number; name: string }[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ShopClientProps {
  initialData: {
    products: Product[];
    categories: Category[];
    tags: Tag[];
    pagination: Pagination;
  };
  initialCategory?: string;
}

export function ShopClient({ initialData, initialCategory }: ShopClientProps) {
  const router = useRouter();

  const handleNavigate = (view: string, data?: Record<string, unknown>) => {
    if (view === "product" && data?.slug) {
      router.push(`/shop/products/${data.slug}`);
      return;
    }
    if (view === "shop") {
      const cat = data?.category as string | undefined;
      router.push(cat ? `/shop?category=${cat}` : "/shop");
      return;
    }
    if (view === "home") {
      router.push("/");
      return;
    }
    router.push(`/${view}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <ProductListing
        initialCategory={initialCategory}
        initialData={initialData}
        onNavigate={handleNavigate}
      />
    </div>
  );
}