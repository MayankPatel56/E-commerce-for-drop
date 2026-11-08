"use client";

import { LoginModal } from "@/components/store/login-modal";
import { useStoreNavigate } from "@/hooks/useStoreNavigate";

export function LoginPageClient() {
  const navigate = useStoreNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <LoginModal
        onClose={() => navigate("home")}
        initialView="login"
      />
    </div>
  );
}