"use client";

import { useRouter } from "next/navigation";
import { ProductListing } from "./product-listing";
import type { Product, ProductCategory, ProductTag } from "@/lib/product-types";

interface ShopClientProps {
  initialData: {
    products: Product[];
    categories: (ProductCategory & { productCount: number })[];
    tags: (ProductTag & { productCount: number })[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
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