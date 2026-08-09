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
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Package,
  X,
  ArrowRight,
} from "lucide-react";

interface Category {
  id: number;
  name: string;
  slug: string;
  is_active?: boolean;
  parent_id?: number | null;
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
  { id: "home", label: "Home", icon: "🏠" },
  { id: "shop", label: "Shop", icon: "🛍️" },
] as const;

const SECONDARY_NAV_LINKS = [
  { id: "about", label: "About Us" },
  { id: "track-order", label: "Track Order" },
  { id: "contact", label: "Contact Us" },
] as const;

const ALL_MOBILE_LINKS = [
  { id: "home", label: "Home", icon: "🏠" },
  { id: "shop", label: "Shop", icon: "🛍️" },
  { id: "about", label: "About Us", icon: "ℹ️" },
  { id: "track-order", label: "Track Order", icon: "📦" },
  { id: "contact", label: "Contact Us", icon: "📧" },
] as const;

const CUSTOMER_NAV_LINKS = [
  { id: "customer-dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "customer-wishlist", label: "Wishlist", icon: Heart },
  { id: "customer-orders", label: "My Orders", icon: Package },
  { id: "customer-reviews", label: "My Reviews", icon: Star },
  { id: "customer-profile", label: "Profile", icon: User },
] as const;

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
    <div className="flex flex-col h-full bg-linear-to-b from-black to-neutral-900 text-white">
      <SheetHeader className="border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <SheetTitle className="flex items-center text-white">
            <Image
              src="/logo.png"
              alt="Indicore Originals"
              width={180}
              height={50}
              className="object-contain"
            />
          </SheetTitle>
          <Button
            variant="ghost"
            size="sm"
            className="min-h-11 min-w-11 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </SheetHeader>

      <nav className="flex-1 overflow-y-auto px-4 py-6" aria-label="Mobile navigation">
        <ul className="space-y-1">
          {ALL_MOBILE_LINKS.map((link) => (
            <li key={link.id}>
              <button
                type="button"
                onClick={() => handleNav(link.id)}
                className="flex items-center gap-3 w-full rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-200 min-h-12 text-left text-white/80 hover:bg-white/10 hover:text-orange-400 group"
              >
                <span className="text-lg">{link.icon}</span>
                <span>{link.label}</span>
                <ArrowRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-6 border-t border-white/10 pt-6 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 min-h-12 text-white/80 hover:bg-white/10 hover:text-orange-400 rounded-xl"
            onClick={() => handleNav("search")}
          >
            <Search className="h-4 w-4" />
            Search Products
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start gap-3 min-h-12 text-white/80 hover:bg-white/10 hover:text-orange-400 rounded-xl"
            onClick={handleCart}
          >
            <ShoppingCart className="h-4 w-4" />
            Cart
            {cartCount > 0 && (
              <Badge className="ml-auto bg-orange-500 text-white border-0">
                {cartCount}
              </Badge>
            )}
          </Button>

          {isAuthenticated ? (
            <div className="space-y-1">
              <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-r from-orange-500 to-orange-400 text-white font-semibold text-sm">
                  {userName?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{userName}</p>
                  <p className="text-xs text-white/40">{userRole === "admin" ? "Administrator" : "Customer"}</p>
                </div>
              </div>

              {userRole === "admin" && (
                <button
                  type="button"
                  onClick={() => handleNav("admin")}
                  className="flex items-center gap-3 w-full rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-200 min-h-12 text-left bg-orange-500/10 text-orange-400 hover:bg-orange-500/20"
                >
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>Admin Panel</span>
                  <ShieldCheck className="h-3 w-3 ml-auto opacity-50" />
                </button>
              )}

              {CUSTOMER_NAV_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <button
                    key={link.id}
                    type="button"
                    onClick={() => handleNav(link.id)}
                    className="flex items-center gap-3 w-full rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-200 min-h-12 text-left text-white/70 hover:bg-white/10 hover:text-orange-400"
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{link.label}</span>
                  </button>
                );
              })}

              <Button
                variant="ghost"
                className="w-full justify-start gap-3 min-h-12 text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded-xl mt-2"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          ) : (
            <Button
              variant="default"
              className="w-full justify-center gap-2 min-h-12 rounded-xl bg-linear-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white shadow-lg shadow-orange-500/20"
              onClick={handleLogin}
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </Button>
          )}
        </div>
      </nav>
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
  userRole,
  currentView,
}: StoreHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch categories
  useEffect(() => {
    let active = true;
    setLoading(true);
    
    fetch("/api/categories?active=true")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch categories");
        return res.json();
      })
      .then((data) => {
        if (active) {
          const activeCategories = Array.isArray(data) 
            ? data.filter((cat: Category) => cat.is_active !== false)
            : [];
          setCategories(activeCategories);
        }
      })
      .catch(() => {
        // Silent fail
      })
      .finally(() => {
        if (active) setLoading(false);
      });
      
    return () => {
      active = false;
    };
  }, []);

  const linkClass = (id: string) =>
    `px-3 py-2 text-sm font-medium transition-colors duration-200 min-h-11 rounded-lg ${
      currentView === id
        ? "text-orange-400 bg-white/5"
        : "text-white/70 hover:text-orange-400 hover:bg-white/5"
    }`;

  return (
    <header 
      className={`sticky top-0 z-40 w-full transition-colors duration-300 ${
        scrolled 
          ? "bg-black/95 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-black/20" 
          : "bg-black border-b border-white/5"
      }`}
    >
      {/* Top announcement bar */}
      <div className="hidden md:block bg-linear-to-r from-orange-500/10 via-orange-500/5 to-transparent border-b border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4 text-white/40">
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-orange-400" />
                Free shipping on orders above ₹499
              </span>
              <span className="text-white/10">|</span>
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-orange-400" />
                COD available
              </span>
            </div>
            <div className="flex items-center gap-2 text-white/30">
              <span className="flex items-center gap-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                Live
              </span>
            </div>
          </div>
        </div>
      </div>

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
            className="h-10 w-auto object-contain sm:h-12"
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
              <span className="flex items-center gap-1.5">
                <span>{link.icon}</span>
                {link.label}
              </span>
            </button>
          ))}

          {/* Categories dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`${linkClass("categories")} flex items-center gap-1`}
                aria-label="Browse product categories"
              >
                <span>📂 Categories</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="bg-neutral-900/95 backdrop-blur-xl border-white/10 text-white min-w-55 shadow-2xl rounded-2xl p-1"
            >
              {loading ? (
                <DropdownMenuItem disabled className="text-white/40">
                  Loading categories...
                </DropdownMenuItem>
              ) : categories.length > 0 ? (
                <>
                  <DropdownMenuItem
                    onClick={() => onNavigate("shop")}
                    className="cursor-pointer focus:bg-white/10 focus:text-orange-400 font-medium rounded-xl m-1"
                  >
                    <span className="flex items-center gap-2">
                      <span>🛍️</span> All Products
                    </span>
                  </DropdownMenuItem>
                  {categories.map((cat) => (
                    <DropdownMenuItem
                      key={cat.id}
                      onClick={() => onNavigate("shop", { category: cat.slug })}
                      className="cursor-pointer focus:bg-white/10 focus:text-orange-400 rounded-xl m-1"
                    >
                      {cat.name}
                    </DropdownMenuItem>
                  ))}
                </>
              ) : (
                <DropdownMenuItem
                  onClick={() => onNavigate("shop")}
                  className="cursor-pointer focus:bg-white/10 focus:text-orange-400 rounded-xl m-1"
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
            className="hidden md:inline-flex min-h-11 min-w-11 p-2 text-white/70 hover:text-orange-400 hover:bg-white/5 rounded-full transition-colors duration-200"
            onClick={() => onNavigate("search")}
            aria-label="Search products"
          >
            <Search className="h-5 w-5" />
          </Button>

          <div className="hidden md:flex items-center gap-1">
            {isAuthenticated ? (
              <>
                {userRole === "admin" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="min-h-11 gap-1.5 px-3 text-white/70 hover:text-orange-400 hover:bg-white/5 rounded-full transition-colors duration-200"
                    onClick={() => onNavigate("admin")}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span className="text-xs font-medium">Admin</span>
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="min-h-11 gap-2 px-3 text-white/70 hover:text-orange-400 hover:bg-white/5 rounded-full transition-colors duration-200"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-linear-to-r from-orange-500 to-orange-400 text-white font-semibold text-xs">
                        {userName?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <span className="max-w-20 truncate text-sm font-medium">
                        {userName}
                      </span>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-neutral-900/95 backdrop-blur-xl border-white/10 text-white min-w-50 shadow-2xl rounded-2xl p-1"
                  >
                    {CUSTOMER_NAV_LINKS.map((link) => {
                      const Icon = link.icon;
                      return (
                        <DropdownMenuItem
                          key={link.id}
                          onClick={() => onNavigate(link.id)}
                          className="cursor-pointer focus:bg-white/10 focus:text-orange-400 rounded-xl m-1 gap-2"
                        >
                          <Icon className="h-4 w-4" />
                          {link.label}
                        </DropdownMenuItem>
                      );
                    })}
                    <DropdownMenuItem
                      onClick={onLogout}
                      className="cursor-pointer focus:bg-red-500/10 focus:text-red-400 rounded-xl m-1 gap-2 text-red-400"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="min-h-11 gap-2 px-4 text-white/70 hover:text-orange-400 hover:bg-white/5 rounded-full transition-colors duration-200"
                onClick={onOpenLogin}
              >
                <User className="h-4 w-4" />
                <span className="text-sm font-medium hidden sm:inline">Sign In</span>
              </Button>
            )}
          </div>

          {/* Cart Button */}
          <Button
            variant="ghost"
            size="sm"
            className="relative min-h-11 min-w-11 p-2 text-white/70 hover:text-orange-400 hover:bg-white/5 rounded-full transition-colors duration-200"
            onClick={onOpenCart}
            aria-label={`Cart with ${cartCount} item${cartCount !== 1 ? "s" : ""}`}
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-linear-to-r from-orange-500 to-orange-400 px-1 text-[10px] font-bold text-white shadow-lg shadow-orange-500/30">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Button>

          {/* Mobile Menu Button */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="min-h-11 min-w-11 p-2 md:hidden text-white/70 hover:text-orange-400 hover:bg-white/5 rounded-full transition-colors duration-200"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0 border-l border-white/10">
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