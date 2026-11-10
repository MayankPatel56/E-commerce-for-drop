"use client";

import { useEffect, useRef, useState } from "react";
import { StoreHeader } from "@/components/store/store-header";
import { StoreFooter } from "@/components/store/store-footer";
import { CartDrawer } from "@/components/store/cart-drawer";
import { LoginModal } from "@/components/store/login-modal";
import { useCart } from "@/context/cart-context";
import { useStoreNavigate } from "@/hooks/useStoreNavigate";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigate = useStoreNavigate();
  const [cartOpen, setCartOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { totalItems } = useCart();

  // Track previous totalItems so we only auto-open the drawer when an item is
  // actually added (quantity increases), not on first page load or after the
  // user closes it.
  const prevTotalRef = useRef(0);
  const userClosedRef = useRef(false);

  useEffect(() => {
    // Only auto-open when the cart count increases after an add-to-cart action.
    if (totalItems > prevTotalRef.current && !userClosedRef.current) {
      setCartOpen(true);
    }
    prevTotalRef.current = totalItems;
  }, [totalItems]);

  // When the drawer is closed by the user, mark it so we don't reopen it
  // until the next add-to-cart action.
  useEffect(() => {
    if (!cartOpen) {
      userClosedRef.current = true;
    }
  }, [cartOpen]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <StoreHeader
        onOpenCart={() => setCartOpen(true)}
        cartCount={totalItems}
        onOpenLogin={() => setShowLoginModal(true)}
        onLogout={() => {}}
        isAuthenticated={false}
        userName={undefined}
        userRole={undefined}
        currentView={undefined}
      />

      <main className="flex-1">
        {children}
      </main>

      <StoreFooter footer={{ contact_text: "", social_links: {}, copyright_text: "" }} />

      <CartDrawer
        open={cartOpen}
        onOpenChange={setCartOpen}
        onNavigate={navigate}
      />

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
        />
      )}
    </div>
  );
}