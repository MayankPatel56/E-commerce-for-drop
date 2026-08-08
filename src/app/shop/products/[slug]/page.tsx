"use client";
import ProductDetail from "@/components/store/product-detail";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkedSession, setCheckedSession] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setIsAuthenticated(true);
        }
      })
      .catch(() => {})
      .finally(() => setCheckedSession(true));
  }, []);

  const handleNavigate = (view: string, data?: Record<string, unknown>) => {
    if (view === "shop") {
      const category = data?.category as string | undefined;
      router.push(category ? `/shop?category=${encodeURIComponent(category)}` : "/shop");
      return;
    }
    if (view === "checkout") {
      router.push("/checkout");
      return;
    }
    if (view === "login") {
      router.push(`/?login=1&redirect=/shop/products/${slug}`);
      return;
    }
    router.push("/");
  };

  if (!checkedSession) {
    return null;
  }

  return (
    <ProductDetail
      slug={slug}
      onNavigate={handleNavigate}
      isAuthenticated={isAuthenticated}
    />
  );
}
