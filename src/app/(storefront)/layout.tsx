"use client";

import { useState, Suspense } from "react";
import { StoreHeader } from "@/components/store/store-header";
import { StoreFooter } from "@/components/store/store-footer";
import { CartDrawer } from "@/components/store/cart-drawer";
import { LoginModal } from "@/components/store/login-modal";
import { useCart } from "@/context/cart-context";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cartOpen, setCartOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { totalItems } = useCart();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <StoreHeader
        onOpenCart={() => setCartOpen(true)}
        cartCount={totalItems}
        onOpenLogin={() => setShowLoginModal(true)}
      />

      <main className="flex-1">
        {children}
      </main>

      <StoreFooter />

      <CartDrawer
        open={cartOpen}
        onOpenChange={setCartOpen}
      />

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
        />
      )}
    </div>
  );
}