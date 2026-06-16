"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Store,
  Search,
  ShoppingCart,
  Menu,
  LogIn,
  LogOut,
  User,
  X,
} from "lucide-react";

interface StoreHeaderProps {
  onNavigate: (view: string, data?: Record<string, unknown>) => void;
  onOpenCart: () => void;
  cartCount: number;
  onOpenLogin: () => void;
  onLogout: () => void;
  isAuthenticated: boolean;
  userName?: string;
}

const NAV_LINKS = [
  { id: "home", label: "Home" },
  { id: "shop", label: "Shop" },
  { id: "track-order", label: "Track Order" },
] as const;

function MobileNav({
  onNavigate,
  onOpenCart,
  cartCount,
  onOpenLogin,
  onLogout,
  isAuthenticated,
  userName,
  onClose,
}: StoreHeaderProps & { onClose: () => void }) {
  const handleNav = (view: string) => {
    onNavigate(view);
    onClose();
  };

  const handleCart = () => {
    onOpenCart();
    onClose();
  };

  const handleLogin = () => {
    onOpenLogin();
    onClose();
  };

  const handleLogout = () => {
    onLogout();
    onClose();
  };

  return (
    <div className="flex flex-col h-full">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          Indicore Originals
        </SheetTitle>
      </SheetHeader>

      <nav className="flex-1 py-4" aria-label="Mobile navigation">
        <ul className="space-y-1">
          {NAV_LINKS.map((link) => (
            <li key={link.id}>
              <button
                type="button"
                onClick={() => handleNav(link.id)}
                className="flex items-center w-full rounded-md px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px] text-left text-foreground hover:bg-accent hover:text-accent-foreground"
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t pt-4 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 min-h-[44px]"
          onClick={() => handleNav("search")}
        >
          <Search className="h-4 w-4" />
          Search
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 min-h-[44px]"
          onClick={handleCart}
        >
          <ShoppingCart className="h-4 w-4" />
          Cart
          {cartCount > 0 && (
            <Badge variant="default" className="ml-auto">
              {cartCount}
            </Badge>
          )}
        </Button>

        {isAuthenticated ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="truncate">{userName ?? "Account"}</span>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 min-h-[44px] text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 min-h-[44px]"
            onClick={handleLogin}
          >
            <LogIn className="h-4 w-4" />
            Login
          </Button>
        )}
      </div>
    </div>
  );
}

export function StoreHeader({
  onNavigate,
  onOpenCart,
  cartCount,
  onOpenLogin,
  onLogout,
  isAuthenticated,
  userName,
}: StoreHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-background border-b">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Logo */}
        <button
          type="button"
          onClick={() => onNavigate("home")}
          className="flex items-center gap-2 min-h-[44px] shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          <Store className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold tracking-tight whitespace-nowrap hidden xs:inline">
            Indicore Originals
          </span>
          <span className="text-lg font-bold tracking-tight xs:hidden">
            Indicore
          </span>
        </button>

        {/* Center: Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => onNavigate(link.id)}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors min-h-[44px] rounded-md hover:bg-accent"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {/* Search — desktop */}
          <Button
            variant="ghost"
            size="sm"
            className="min-h-[44px] min-w-[44px] p-2 hidden md:inline-flex"
            onClick={() => onNavigate("search")}
            aria-label="Search products"
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Cart */}
          <Button
            variant="ghost"
            size="sm"
            className="relative min-h-[44px] min-w-[44px] p-2"
            onClick={onOpenCart}
            aria-label={`Cart with ${cartCount} item${cartCount !== 1 ? "s" : ""}`}
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <Badge
                variant="default"
                className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center px-1 text-[10px] font-bold"
              >
                {cartCount > 99 ? "99+" : cartCount}
              </Badge>
            )}
          </Button>

          {/* Login / User — desktop */}
          <div className="hidden md:flex items-center gap-1">
            {isAuthenticated ? (
              <>
                <span className="flex items-center gap-1.5 px-2 text-sm text-muted-foreground min-h-[44px]">
                  <User className="h-4 w-4" />
                  <span className="max-w-[120px] truncate">{userName}</span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-h-[44px] min-w-[44px] p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={onLogout}
                  aria-label="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[44px] gap-1.5 px-3"
                onClick={onOpenLogin}
              >
                <LogIn className="h-4 w-4" />
                Login
              </Button>
            )}
          </div>

          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[44px] min-w-[44px] p-2 md:hidden"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <MobileNav
                onNavigate={onNavigate}
                onOpenCart={onOpenCart}
                cartCount={cartCount}
                onOpenLogin={onOpenLogin}
                onLogout={onLogout}
                isAuthenticated={isAuthenticated}
                userName={userName}
                onClose={() => setMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}