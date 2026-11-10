"use client";

import { Suspense } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { requireAdmin } from "@/lib/admin-auth";
import { CartDrawer } from "@/components/store/cart-drawer";
import { StoreHeader } from "@/components/store/store-header";
import { StoreFooter } from "@/components/store/store-footer";
import { useStoreNavigate } from "@/hooks/useStoreNavigate";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const navigate = useStoreNavigate();
  const [admin, setAdmin] = useState<boolean | null>(null);

  // Check admin auth on mount
  useEffect(() => {
    const checkAdmin = async () => {
      const { error } = await requireAdmin();
      if (error) {
        router.push("/login");
        return;
      }
      setAdmin(true);
    };
    checkAdmin();
  }, [router, requireAdmin]);

  if (admin === null) {
    return null; // Loading state
  }

  if (!admin) {
    return null; // Not authorized
  }

  return (
    <div className="min-h-screen bg-background">
      <StoreHeader
        onNavigate={navigate}
        onOpenCart={() => navigate("cart")}
        cartCount={0}
        onOpenLogin={() => navigate("login")}
        onLogout={() => {
          navigate("login");
          router.push("/login");
        }}
        isAuthenticated={true}
        userName="Admin"
        userRole="admin"
      />
      <main className="flex-1 p-4">
        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
          {children}
        </Suspense>
      </main>
      <StoreFooter footer={{ contact_text: "Get in touch", social_links: {}, copyright_text: "© 2024 Indicore Originals" }} />
    </div>
  );
}