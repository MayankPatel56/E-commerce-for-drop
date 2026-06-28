"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { signIn, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Store,
  AlertTriangle,
} from "lucide-react";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const AdminSidebar = dynamic(
  () => import("@/components/admin/admin-sidebar").then((mod) => ({ default: mod.AdminSidebar })),
  { ssr: false, loading: () => <Skeleton className="h-96 w-full" /> }
);
const ProductsTable = dynamic(
  () => import("@/components/admin/products-table").then((mod) => ({ default: mod.ProductsTable })),
  { ssr: false, loading: () => <Skeleton className="h-96 w-full" /> }
);
const ProductForm = dynamic(
  () => import("@/components/admin/product-form").then((mod) => ({ default: mod.ProductForm })),
  { ssr: false, loading: () => <Skeleton className="h-96 w-full" /> }
);
const VariantManager = dynamic(
  () => import("@/components/admin/variant-manager").then((mod) => ({ default: mod.VariantManager })),
  { ssr: false, loading: () => <Skeleton className="h-96 w-full" /> }
);
const CategoriesManager = dynamic(
  () => import("@/components/admin/categories-manager").then((mod) => ({ default: mod.CategoriesManager })),
  { ssr: false, loading: () => <Skeleton className="h-96 w-full" /> }
);
const TagsManager = dynamic(
  () => import("@/components/admin/tags-manager").then((mod) => ({ default: mod.TagsManager })),
  { ssr: false, loading: () => <Skeleton className="h-96 w-full" /> }
);
const OrdersTable = dynamic(
  () => import("@/components/admin/orders-table").then((mod) => ({ default: mod.OrdersTable })),
  { ssr: false, loading: () => <Skeleton className="h-96 w-full" /> }
);
const OrderDetail = dynamic(
  () => import("@/components/admin/order-detail").then((mod) => ({ default: mod.OrderDetail })),
  { ssr: false, loading: () => <Skeleton className="h-96 w-full" /> }
);
const AdminReviewsTable = dynamic(
  () => import("@/components/admin/admin-reviews-table").then((mod) => ({ default: mod.AdminReviewsTable })),
  { ssr: false, loading: () => <Skeleton className="h-96 w-full" /> }
);
const AdminDashboard = dynamic(
  () => import("@/components/admin/admin-dashboard").then((mod) => ({ default: mod.AdminDashboard })),
  { ssr: false, loading: () => <Skeleton className="h-96 w-full" /> }
);
const AnalyticsDashboard = dynamic(
  () => import("@/components/admin/analytics-dashboard").then((mod) => ({ default: mod.AnalyticsDashboard })),
  { ssr: false, loading: () => <Skeleton className="h-96 w-full" /> }
);
const HomepageEditor = dynamic(
  () => import("@/components/admin/homepage-editor").then((mod) => ({ default: mod.HomepageEditor })),
  { ssr: false, loading: () => <Skeleton className="h-96 w-full" /> }
);
const FaqManager = dynamic(
  () => import("@/components/admin/faq-manager").then((mod) => ({ default: mod.FaqManager })),
  { ssr: false, loading: () => <Skeleton className="h-96 w-full" /> }
);
const SettingsManager = dynamic(
  () => import("@/components/admin/settings-manager").then((mod) => ({ default: mod.SettingsManager })),
  { ssr: false, loading: () => <Skeleton className="h-96 w-full" /> }
);
const CustomersTable = dynamic(
  () => import("@/components/admin/customers-table").then((mod) => ({ default: mod.CustomersTable })),
  { ssr: false, loading: () => <Skeleton className="h-96 w-full" /> }
);

import { StoreHeader } from "@/components/store/store-header";
import StorefrontHomepage from "@/components/store/storefront-homepage";
import { ProductListing } from "@/components/store/product-listing";
import ProductDetail from "@/components/store/product-detail";
import { CartDrawer } from "@/components/store/cart-drawer";
import { CheckoutPage } from "@/components/store/checkout-page";
import { OrderConfirmation } from "@/components/store/order-confirmation";
import { TrackOrderPage } from "@/components/store/track-order-page";
import { CustomerDashboard } from "@/components/store/customer-dashboard";
import { CustomerProfile } from "@/components/store/customer-profile";
import { CustomerWishlist } from "@/components/store/customer-wishlist";
import { CustomerReviews } from "@/components/store/customer-reviews";
import { CustomerOrders } from "@/components/store/customer-orders";
import { useCart } from "@/context/cart-context";
import {
  PrivacyPolicyPage,
  TermsPage,
  ReturnPolicyPage,
  AboutPage,
  ContactPage,
  FaqPage,
} from "@/components/store/compliance-pages";

// ─── Types ──────────────────────────────────────────────────────────────────

type AppView =
  | "home"
  | "shop"
  | "product"
  | "search"
  | "track-order"
  | "checkout"
  | "order-confirmation"
  | "login"
  | "signup"
  | "admin"
  | "customer-dashboard"
  | "customer-profile"
  | "customer-wishlist"
  | "customer-orders"
  | "customer-reviews"
  | "privacy"
  | "terms"
  | "returns"
  | "about"
  | "contact"
  | "faq";

type AdminPanel =
  | "dashboard"
  | "orders"
  | "order-detail"
  | "products"
  | "categories"
  | "tags"
  | "reviews"
  | "product-edit"
  | "product-new"
  | "product-variants"
  | "homepage"
  | "faq"
  | "settings"
  | "analytics"
  | "customers";

interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  name?: string;
  phone?: string;
  general?: string;
}

// ─── Page Component ─────────────────────────────────────────────────────────

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  // Navigation state
  const [appView, setAppView] = useState<AppView>("home");
  const [productSlug, setProductSlug] = useState<string | null>(null);
  const [initialCategory, setInitialCategory] = useState<string | undefined>();

  // Auth state
  const [user, setUser] = useState<UserInfo | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Cart drawer state
  const [cartOpen, setCartOpen] = useState(false);
  const { totalItems } = useCart();

  // Checkout state
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  // Admin state
  const [adminPanel, setAdminPanel] = useState<AdminPanel>("dashboard");
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [variantProductId, setVariantProductId] = useState<number | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupPhone, setSignupPhone] = useState("");

  // Shared UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [lockoutInfo, setLockoutInfo] = useState<{ locked: boolean; remainingMinutes: number } | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Check session on mount
  useEffect(() => {
    checkSession();
    if (errorParam === "access_denied") {
      setGeneralError("You do not have permission to access that page.");
    }
  }, [errorParam]);

  const checkSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user as UserInfo);
        if (data.user.role === "admin") {
          setAppView("admin");
        }
      }
    } catch {
      // Not authenticated
    }
  };

  // ─── Navigation Handler ─────────────────────────────────────────────────

  const handleNavigate = useCallback((view: string, data?: Record<string, unknown>) => {
    window.scrollTo(0, 0);
    if (view === "admin") {
      // Only admin can go to admin
      if (user?.role === "admin") {
        setAppView("admin");
      }
      return;
    }
    if (view === "login") {
      if (user) return; // Already logged in
      setShowLoginModal(true);
      return;
    }
    if (view === "product") {
      const slug = data?.slug as string;
      if (slug) {
        setProductSlug(slug);
        setAppView("product");
      }
      return;
    }
    if (view === "shop") {
      setInitialCategory(data?.category as string | undefined);
      setAppView("shop");
      return;
    }
    if (view === "search") {
      setAppView("search");
      return;
    }
    if (view === "track-order") {
      setAppView("track-order");
      return;
    }
    if (view === "checkout") {
      setOrderNumber(null);
      setAppView("checkout");
      return;
    }
    // Customer views
    if (view === "customer-dashboard" || view === "customer-profile" || view === "customer-wishlist" || view === "customer-reviews" || view === "customer-orders") {
      if (!user) {
        setShowLoginModal(true);
        return;
      }
      setAppView(view as AppView);
      return;
    }
    // Default: home
    setAppView(view as AppView);
  }, [user]);

  // ─── Auth Handlers ──────────────────────────────────────────────────────

  const validateLogin = (): boolean => {
    const errors: FormErrors = {};
    if (!loginEmail.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail))
      errors.email = "Enter a valid email address";
    if (!loginPassword) errors.password = "Password is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateSignup = (): boolean => {
    const errors: FormErrors = {};
    if (!signupName.trim()) errors.name = "Name is required";
    else if (signupName.trim().length < 2) errors.name = "Name must be at least 2 characters";
    if (!signupEmail.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail))
      errors.email = "Enter a valid email address";
    if (!signupPassword) errors.password = "Password is required";
    else if (signupPassword.length < 8) errors.password = "Password must be at least 8 characters";
    if (!signupPhone.trim()) errors.phone = "Phone number is required";
    else if (!/^[0-9]{10}$/.test(signupPhone.trim()))
      errors.phone = "Enter a valid 10-digit phone number";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setLockoutInfo(null);
    if (!validateLogin()) return;
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword,
        redirect: false,
      });
      if (result?.error) {
        if (result.error.includes("ACCOUNT_LOCKED")) {
          const minutes = parseInt(result.error.split(":")[1]) || 15;
          setLockoutInfo({ locked: true, remainingMinutes: minutes });
          setGeneralError(
            `Account locked due to too many failed attempts. Please try again in ${minutes} minutes.`
          );
        } else {
          setGeneralError("Invalid email or password");
        }
      } else if (result?.ok) {
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        if (sessionData.authenticated && sessionData.user) {
          setUser(sessionData.user as UserInfo);
          setShowLoginModal(false);
          if (sessionData.user.role === "admin") {
            setAppView("admin");
          }
        }
      }
    } catch {
      setGeneralError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    if (!validateSignup()) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: signupName.trim(),
          email: signupEmail.trim().toLowerCase(),
          password: signupPassword,
          phone: signupPhone.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGeneralError(data.error || "Signup failed");
        return;
      }
      // Auto-signin
      const result = await signIn("credentials", {
        email: signupEmail.trim().toLowerCase(),
        password: signupPassword,
        redirect: false,
      });
      if (result?.ok) {
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        if (sessionData.authenticated) {
          setUser(sessionData.user as UserInfo);
        }
      }
      setShowLoginModal(false);
      setLoginEmail(signupEmail);
    } catch {
      setGeneralError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    setUser(null);
    setAppView("home");
    setAdminPanel("products");
    setEditingProductId(null);
    setVariantProductId(null);
    setLoginEmail("");
    setLoginPassword("");
    setShowLoginModal(false);
  };

  // ─── Admin Panel Handlers ────────────────────────────────────────────────

  const handleViewChange = useCallback((view: string) => {
    setEditingProductId(null);
    setVariantProductId(null);
    setAdminPanel(view as AdminPanel);
    setSelectedOrderId(null);
  }, []);

  const handleEditProduct = useCallback((id: number) => {
    setEditingProductId(id);
    setAdminPanel("product-edit");
  }, []);

  const handleCreateProduct = useCallback(() => {
    setEditingProductId(null);
    setAdminPanel("product-new");
  }, []);

  const handleManageVariants = useCallback((id: number) => {
    setVariantProductId(id);
    setAdminPanel("product-variants");
  }, []);

  const handleFormSuccess = useCallback(() => {
    setAdminPanel("products");
    setEditingProductId(null);
    setRefreshKey((k) => k + 1);
  }, []);

  const handleFormCancel = useCallback(() => {
    setAdminPanel("products");
    setEditingProductId(null);
  }, []);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  // ─── Admin Order Handlers ──────────────────────────────────────────────

  const handleViewOrder = useCallback((orderId: number) => {
    setSelectedOrderId(orderId);
    setAdminPanel("order-detail");
  }, []);

  const handleBackToOrders = useCallback(() => {
    setSelectedOrderId(null);
    setAdminPanel("orders");
    setRefreshKey((k) => k + 1);
  }, []);

  // ─── Checkout Handlers ────────────────────────────────────────────────────

  const handleOrderSuccess = useCallback((successOrderNumber: string) => {
    setOrderNumber(successOrderNumber);
    setAppView("order-confirmation");
  }, []);

  // ─── Render: Login / Signup Modal ───────────────────────────────────────

  const renderLoginModal = () => {
    if (!showLoginModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => { setShowLoginModal(false); setFormErrors({}); setGeneralError(null); setLockoutInfo(null); }}
        />
        {/* Modal */}
        <Card className="relative w-full max-w-md shadow-xl z-10">
          <CardHeader className="text-center space-y-2 pb-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {appView === "login" ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <CardDescription>
              {appView === "login"
                ? "Enter your credentials to access your account"
                : "Join Indicore Originals today"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lockoutInfo?.locked && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{generalError}</AlertDescription>
              </Alert>
            )}
            {generalError && !lockoutInfo?.locked && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{generalError}</AlertDescription>
              </Alert>
            )}
            {appView === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" placeholder="you@example.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} disabled={isLoading || !!lockoutInfo?.locked} autoComplete="email" autoFocus />
                  {formErrors.email && <p className="text-sm text-destructive">{formErrors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input id="login-password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} disabled={isLoading || !!lockoutInfo?.locked} autoComplete="current-password" className="pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1} aria-label={showPassword ? "Hide password" : "Show password"}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {formErrors.password && <p className="text-sm text-destructive">{formErrors.password}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading || !!lockoutInfo?.locked}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : lockoutInfo?.locked ? `Locked — Try in ${lockoutInfo.remainingMinutes} min` : "Sign In"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input id="signup-name" type="text" placeholder="Rahul Sharma" value={signupName} onChange={(e) => setSignupName(e.target.value)} disabled={isLoading} autoComplete="name" autoFocus />
                  {formErrors.name && <p className="text-sm text-destructive">{formErrors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" placeholder="you@example.com" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} disabled={isLoading} autoComplete="email" />
                  {formErrors.email && <p className="text-sm text-destructive">{formErrors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Phone Number</Label>
                  <Input id="signup-phone" type="tel" placeholder="9876543210" value={signupPhone} onChange={(e) => setSignupPhone(e.target.value)} disabled={isLoading} autoComplete="tel" maxLength={10} />
                  {formErrors.phone && <p className="text-sm text-destructive">{formErrors.phone}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input id="signup-password" type={showPassword ? "text" : "password"} placeholder="Min 8 characters" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} disabled={isLoading} autoComplete="new-password" className="pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1} aria-label={showPassword ? "Hide password" : "Show password"}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {formErrors.password && <p className="text-sm text-destructive">{formErrors.password}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</> : "Create Account"}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Separator />
            <p className="text-sm text-muted-foreground text-center">
              {appView === "login" ? (
                <>Don&apos;t have an account?{" "}
                  <button type="button" onClick={() => { setAppView("signup"); setFormErrors({}); setGeneralError(null); setLockoutInfo(null); }} className="text-primary font-medium hover:underline">Sign up</button></>
              ) : (
                <>Already have an account?{" "}
                  <button type="button" onClick={() => { setAppView("login"); setFormErrors({}); setGeneralError(null); setLockoutInfo(null); }} className="text-primary font-medium hover:underline">Sign in</button></>
              )}
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  };

  // ─── Render: Storefront Views ───────────────────────────────────────────

  const renderStorefront = () => (
    <div className="min-h-screen flex flex-col bg-background">
      <StoreHeader
        onNavigate={handleNavigate}
        onOpenCart={() => setCartOpen(true)}
        cartCount={totalItems}
        userRole={user?.role} 
        onOpenLogin={() => { setAppView("login"); setShowLoginModal(true); setFormErrors({}); setGeneralError(null); setLockoutInfo(null); }}
        isAuthenticated={!!user}
        userName={user?.name}
        onLogout={handleLogout}
      />

      <main className="flex-1">
        {appView === "home" && (
          <StorefrontHomepage onNavigate={handleNavigate} />
        )}
        {appView === "shop" && (
          <div className="pt-4">
            <ProductListing
              key={`shop-${initialCategory || "all"}`}
              initialCategory={initialCategory}
              onNavigate={handleNavigate}
            />
          </div>
        )}
        {appView === "product" && productSlug && (
          <div className="pt-4">
            <ProductDetail
              key={productSlug}
              slug={productSlug}
              onNavigate={handleNavigate}
              isAuthenticated={!!user}
            />
          </div>
        )}
        {appView === "search" && (
          <div className="pt-4">
            <ProductListing onNavigate={handleNavigate} />
          </div>
        )}
        {appView === "checkout" && (
          <div className="pt-4">
            <CheckoutPage
              onOrderSuccess={handleOrderSuccess}
              onNavigate={handleNavigate}
            />
          </div>
        )}
        {appView === "order-confirmation" && orderNumber && (
          <div className="pt-4">
            <OrderConfirmation
              orderNumber={orderNumber}
              onNavigate={handleNavigate}
            />
          </div>
        )}
        {appView === "track-order" && (
          <div className="pt-4">
            <TrackOrderPage onNavigate={handleNavigate} />
          </div>
        )}
        {appView === "customer-dashboard" && (
          <div className="px-4 py-6">
            <CustomerDashboard onNavigate={handleNavigate} />
          </div>
        )}
        {appView === "customer-profile" && (
          <div className="pt-4">
            <CustomerProfile />
          </div>
        )}
        {appView === "customer-wishlist" && (
          <CustomerWishlist onNavigate={handleNavigate} />
        )}
        {appView === "customer-orders" && (
          <CustomerOrders onNavigate={handleNavigate} />
        )}
        {appView === "customer-reviews" && (
          <CustomerReviews onNavigate={handleNavigate} />
        )}
        {appView === "privacy" && (
          <PrivacyPolicyPage onNavigate={handleNavigate} />
        )}
        {appView === "terms" && (
          <TermsPage onNavigate={handleNavigate} />
        )}
        {appView === "returns" && (
          <ReturnPolicyPage onNavigate={handleNavigate} />
        )}
        {appView === "about" && (
          <AboutPage onNavigate={handleNavigate} />
        )}
        {appView === "contact" && (
          <ContactPage onNavigate={handleNavigate} />
        )}
        {appView === "faq" && (
          <FaqPage onNavigate={handleNavigate} />
        )}
      </main>

      {/* Footer is rendered by StorefrontHomepage for the home view */}
      {appView !== "home" && (
        <footer className="w-full border-t bg-white py-4 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Indicore Originals. All rights reserved.
          </div>
        </footer>
      )}

      {/* Cart Drawer */}
      <CartDrawer
        open={cartOpen}
        onOpenChange={setCartOpen}
        onNavigate={handleNavigate}
      />
    </div>
  );

  // ─── Render: Admin Dashboard ─────────────────────────────────────────────

  const renderAdminPanel = () => {
    const sidebarView = adminPanel === "product-edit" || adminPanel === "product-new" || adminPanel === "product-variants" ? "products" : adminPanel === "order-detail" ? "orders" : adminPanel;

    return (
      <div className="min-h-screen flex bg-muted/30">
        <AdminSidebar activeView={sidebarView} onViewChange={handleViewChange} onLogout={handleLogout} />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="h-16 border-b bg-white flex items-center px-4 sm:px-6 gap-4">
            <button
              type="button"
              onClick={() => handleNavigate("home")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors min-h-11 flex items-center gap-1"
            >
              <Store className="h-4 w-4" />
              <span className="hidden sm:inline">Store</span>
            </button>
            <h1 className="text-lg font-semibold capitalize hidden sm:block">
              {adminPanel === "product-edit" ? "Edit Product" :
               adminPanel === "product-new" ? "New Product" :
               adminPanel === "product-variants" ? "Manage Variants" :
               adminPanel === "order-detail" ? "Order Detail" :
               adminPanel === "dashboard" ? "Dashboard" :
               adminPanel === "homepage" ? "Homepage Editor" :
               adminPanel === "faq" ? "FAQ Manager" :
               adminPanel === "settings" ? "Settings" :
               adminPanel === "analytics" ? "Analytics" :
               adminPanel === "customers" ? "Customers" :
               adminPanel.charAt(0).toUpperCase() + adminPanel.slice(1)}
            </h1>
            <div className="ml-auto flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user?.name}
              </span>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                Admin
              </span>
            </div>
          </header>

          {/* Panel content */}
          <main className="flex-1 p-4 sm:p-6 overflow-auto">
            {adminPanel === "reviews" && (
              <AdminReviewsTable
                key={refreshKey}
                onRefresh={triggerRefresh}
              />
            )}
            {adminPanel === "orders" && (
              <OrdersTable
                key={refreshKey}
                onViewOrder={handleViewOrder}
                onRefresh={triggerRefresh}
              />
            )}
            {adminPanel === "order-detail" && selectedOrderId != null && (
              <OrderDetail
                key={selectedOrderId}
                orderId={selectedOrderId}
                onBack={handleBackToOrders}
                onRefresh={triggerRefresh}
              />
            )}
            {adminPanel === "products" && (
              <ProductsTable
                key={refreshKey}
                onEdit={handleEditProduct}
                onCreate={handleCreateProduct}
                onRefresh={triggerRefresh}
              />
            )}
            {adminPanel === "product-new" && (
              <div className="max-w-3xl">
                <ProductForm
                  onSuccess={handleFormSuccess}
                  onCancel={handleFormCancel}
                />
              </div>
            )}
            {adminPanel === "product-edit" && editingProductId != null && (
              <div className="max-w-3xl">
                <ProductForm
                  productId={editingProductId}
                  onSuccess={handleFormSuccess}
                  onCancel={handleFormCancel}
                />
                <div className="mt-6">
                  <VariantManager
                    key={`vm-${editingProductId}-${refreshKey}`}
                    productId={editingProductId}
                    onVariantChange={triggerRefresh}
                  />
                </div>
              </div>
            )}
            {adminPanel === "product-variants" && variantProductId != null && (
              <div className="max-w-3xl">
                <VariantManager
                  key={`vm-${variantProductId}-${refreshKey}`}
                  productId={variantProductId}
                  onVariantChange={triggerRefresh}
                />
              </div>
            )}
            {adminPanel === "categories" && (
              <div className="max-w-2xl">
                <CategoriesManager />
              </div>
            )}
            {adminPanel === "tags" && (
              <div className="max-w-2xl">
                <TagsManager />
              </div>
            )}
            {adminPanel === "dashboard" && (
              <AdminDashboard
                onNavigate={handleNavigate}
                onViewOrder={handleViewOrder}
              />
            )}
            {adminPanel === "homepage" && (
              <div className="max-w-3xl">
                <HomepageEditor />
              </div>
            )}
            {adminPanel === "faq" && (
              <div className="max-w-3xl">
                <FaqManager />
              </div>
            )}
            {adminPanel === "settings" && (
              <div className="max-w-2xl">
                <SettingsManager />
              </div>
            )}
            {adminPanel === "analytics" && (
              <AnalyticsDashboard />
            )}
            {adminPanel === "customers" && (
              <CustomersTable />
            )}
          </main>
        </div>
      </div>
    );
  };

  // ─── Main Render ─────────────────────────────────────────────────────────

  if (appView === "admin" && user?.role === "admin") {
    return renderAdminPanel();
  }

  return (
    <>
      {renderStorefront()}
      {renderLoginModal()}
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}