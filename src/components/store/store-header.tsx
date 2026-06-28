"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  ShoppingCart,
  Menu,
  LogIn,
  LogOut,
  User,
  LayoutDashboard,
  Heart,
  Star,
  ChevronDown,
  ShieldCheck, // ✓ FIX 1: Added ShieldCheck import
} from "lucide-react";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface StoreHeaderProps {
  onNavigate: (view: string, data?: Record<string, unknown>) => void;
  onOpenCart: () => void;
  cartCount: number;
  onOpenLogin: () => void;
  onLogout: () => void;
  isAuthenticated: boolean;
  userName?: string;
  userRole?: string;        
  currentView?: string;
}

const NAV_LINKS = [
  { id: "home", label: "Home" },
  { id: "shop", label: "Shop" },
] as const;

const SECONDARY_NAV_LINKS = [
  { id: "about", label: "About Us" },
  { id: "track-order", label: "Track Order" },
  { id: "contact", label: "Contact Us" },
] as const;

const ALL_MOBILE_LINKS = [
  { id: "home", label: "Home" },
  { id: "shop", label: "Shop" },
  { id: "about", label: "About Us" },
  { id: "track-order", label: "Track Order" },
  { id: "contact", label: "Contact Us" },
] as const;

const CUSTOMER_NAV_LINKS = [
  { id: "customer-dashboard", label: "My Account", icon: LayoutDashboard },
  { id: "customer-wishlist", label: "Wishlist", icon: Heart },
  { id: "customer-reviews", label: "My Reviews", icon: Star },
  { id: "customer-profile", label: "Profile", icon: User },
] as const;

// ✓ FIX 2: Added userRole to MobileNav destructuring
function MobileNav({
  onNavigate,
  onOpenCart,
  cartCount,
  onOpenLogin,
  onLogout,
  isAuthenticated,
  userName,
  userRole,
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
    <div className="flex flex-col h-full bg-black text-white">
      <SheetHeader>
        <SheetTitle className="flex items-center text-white">
          <Image
            src="/logo.png"
            alt="Indicore Originals"
            width={220}
            height={60}
            className="object-contain"
          />
        </SheetTitle>
      </SheetHeader>

      <nav className="flex-1 py-4" aria-label="Mobile navigation">
        <ul className="space-y-1">
          {ALL_MOBILE_LINKS.map((link) => (
            <li key={link.id}>
              <button
                type="button"
                onClick={() => handleNav(link.id)}
                className="flex items-center w-full rounded-md px-3 py-2.5 text-sm font-medium transition-colors min-h-11 text-left text-white/90 hover:bg-white/10 hover:text-orange-400"
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-white/10 pt-4 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 min-h-11 text-white/90 hover:bg-white/10 hover:text-orange-400"
          onClick={() => handleNav("search")}
        >
          <Search className="h-4 w-4" />
          Search
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 min-h-11 text-white/90 hover:bg-white/10 hover:text-orange-400"
          onClick={handleCart}
        >
          <ShoppingCart className="h-4 w-4" />
          Cart
          {cartCount > 0 && (
            <Badge variant="default" className="ml-auto bg-orange-500">
              {cartCount}
            </Badge>
          )}
        </Button>

        {/* ✓ FIX 3: Fixed nested ternary - replaced entire broken block */}
        {isAuthenticated ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-white/60">
              <User className="h-4 w-4" />
              <span className="truncate">{userName ?? "Account"}</span>
            </div>
            {userRole === "admin" && (
              <button
                type="button"
                onClick={() => handleNav("admin")}
                className="flex items-center gap-3 w-full rounded-md px-3 py-2.5 text-sm font-medium transition-colors min-h-11 text-left text-orange-400 hover:bg-white/10"
              >
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>Admin Panel</span>
              </button>
            )}
            {CUSTOMER_NAV_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => handleNav(link.id)}
                  className="flex items-center gap-3 w-full rounded-md px-3 py-2.5 text-sm font-medium transition-colors min-h-11 text-left text-white/70 hover:bg-white/10 hover:text-orange-400"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{link.label}</span>
                </button>
              );
            })}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 min-h-11 text-white/70 hover:text-red-400 hover:bg-red-500/10"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 min-h-11 text-white/90 hover:bg-white/10 hover:text-orange-400"
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

// ✓ FIX 4: Added userRole to StoreHeader destructuring
export function StoreHeader({
  onNavigate,
  onOpenCart,
  cartCount,
  onOpenLogin,
  onLogout,
  isAuthenticated,
  userName,
  userRole,
  currentView,
}: StoreHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/homepage")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (active && json?.categories) {
          setCategories(json.categories);
        }
      })
      .catch(() => {
        // Dropdown silently falls back to a plain "Browse all" link
      });
    return () => {
      active = false;
    };
  }, []);

  const linkClass = (id: string) =>
    `px-3 py-2 text-sm font-medium transition-colors min-h-11 rounded-md ${
      currentView === id
        ? "text-orange-400"
        : "text-white/80 hover:text-orange-400 hover:bg-white/5"
    }`;

  return (
    <header className="sticky top-0 z-40 w-full bg-black border-b border-white/10">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Logo */}
        <button
          type="button"
          onClick={() => onNavigate("home")}
          className="flex items-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 rounded-sm"
        >
          <Image
            src="/logo.png"
            alt="Indicore Originals"
            width={400}
            height={174}
            priority
            className="h-12 w-auto object-contain sm:h-20"
          />
        </button>

        {/* Center: Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => onNavigate(link.id)}
              className={linkClass(link.id)}
            >
              {link.label}
            </button>
          ))}

          {/* Categories dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`${linkClass("categories")} flex items-center gap-1`}
              >
                Categories
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="bg-neutral-900 border-white/10 text-white"
            >
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <DropdownMenuItem
                    key={cat.id}
                    onClick={() => onNavigate("shop", { category: cat.slug })}
                    className="cursor-pointer focus:bg-white/10 focus:text-orange-400"
                  >
                    {cat.name}
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem
                  onClick={() => onNavigate("shop")}
                  className="cursor-pointer focus:bg-white/10 focus:text-orange-400"
                >
                  Browse all products
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {SECONDARY_NAV_LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => onNavigate(link.id)}
              className={linkClass(link.id)}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="min-h-11 min-w-11 p-2 hidden md:inline-flex text-white/80 hover:text-orange-400 hover:bg-white/5"
            onClick={() => onNavigate("search")}
            aria-label="Search products"
          >
            <Search className="h-5 w-5" />
          </Button>

          <div className="hidden md:flex items-center">
            {/* ✓ FIX 5: Fixed desktop authenticated block with proper ternary and admin button */}
            {isAuthenticated ? (
              <>
                {userRole === "admin" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="min-h-11 gap-1.5 px-2 text-white/80 hover:text-orange-400 hover:bg-white/5"
                    onClick={() => onNavigate("admin")}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span className="text-xs">Admin Panel</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-h-11 gap-1.5 px-2 text-white/80 hover:text-orange-400 hover:bg-white/5"
                  onClick={() => onNavigate("customer-dashboard")}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="max-w-25 truncate text-xs">{userName}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-h-11 min-w-11 p-2 text-white/60 hover:text-red-400 hover:bg-red-500/10"
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
                className="min-h-11 min-w-11 p-2 text-white/80 hover:text-orange-400 hover:bg-white/5"
                onClick={onOpenLogin}
                aria-label="Login"
              >
                <User className="h-5 w-5" />
              </Button>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="relative min-h-11 min-w-11 p-2 text-white/80 hover:text-orange-400 hover:bg-white/5"
            onClick={onOpenCart}
            aria-label={`Cart with ${cartCount} item${cartCount !== 1 ? "s" : ""}`}
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <Badge
                variant="default"
                className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center px-1 text-[10px] font-bold bg-orange-500 border-0"
              >
                {cartCount > 99 ? "99+" : cartCount}
              </Badge>
            )}
          </Button>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="min-h-11 min-w-11 p-2 md:hidden text-white/80 hover:text-orange-400 hover:bg-white/5"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              {/* ✓ FIX 6: Pass userRole to MobileNav */}
              <MobileNav
                onNavigate={onNavigate}
                onOpenCart={onOpenCart}
                cartCount={cartCount}
                onOpenLogin={onOpenLogin}
                onLogout={onLogout}
                isAuthenticated={isAuthenticated}
                userName={userName}
                userRole={userRole}
                onClose={() => setMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}