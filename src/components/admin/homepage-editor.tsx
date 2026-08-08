"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  Loader2,
  AlertCircle,
  Save,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ImageIcon,
  Star,
  HelpCircle,
  LayoutGrid,
  Shield,
  Footprints,
  Info,
  Package,
  Sparkles,
  CheckCircle2,
  XCircle,
  Globe,
  Instagram,
  Facebook,
  Copy,
  RefreshCw,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Product {
  id: number;
  name: string;
  isPublished: boolean;
  categoryId?: number | null;
  images?: { url: string }[];
}

interface Category {
  id: number;
  name: string;
  _count: { products: number };
}

interface WhyChooseItem {
  icon: string;
  title: string;
  description: string;
}

interface HomepageData {
  id: number;
  heroBanner: {
    image_url: string;
    text: string;
    cta_text: string;
    cta_link: string;
  } | null;
  featuredProductIds: number[] | null;
  categoriesSection: {
    display_categories: number[];
  } | null;
  whyChooseUs: WhyChooseItem[] | null;
  customerReviews: {
    max_reviews_to_show: number;
  } | null;
  footer: {
    contact_text: string;
    social_links: {
      instagram: string;
      facebook: string;
    };
    copyright_text: string;
  } | null;
  updatedAt: string;
}

// ─── Default values ─────────────────────────────────────────────────────────

const DEFAULT_HERO = {
  image_url: "",
  text: "",
  cta_text: "",
  cta_link: "",
};

const DEFAULT_FOOTER = {
  contact_text: "",
  social_links: { instagram: "", facebook: "" },
  copyright_text: "",
};

const DEFAULT_REVIEWS = { max_reviews_to_show: 6 };

// ─── Component ──────────────────────────────────────────────────────────────

export function HomepageEditor() {
  const [data, setData] = useState<HomepageData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    hero: true,
    featured: false,
    categories: false,
    whyChooseUs: false,
    reviews: false,
    faq: false,
    footer: false,
  });

  // ── Fetch all data ─────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [hpRes, prodRes, catRes] = await Promise.all([
        fetch("/api/admin/homepage"),
        fetch("/api/admin/products?limit=100&published=true"),
        fetch("/api/admin/categories?active=true"),
      ]);

      if (!hpRes.ok) throw new Error("Failed to fetch homepage content");

      const hpData: HomepageData = await hpRes.json();
      setData(hpData);

      if (prodRes.ok) {
        const prodJson = await prodRes.json();
        const allProducts = prodJson.products || [];
        setProducts(allProducts);
      }

      if (catRes.ok) {
        const catJson = await catRes.json();
        setCategories(catJson.categories || []);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load homepage data"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateHero = (field: string, value: string) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        heroBanner: { ...(prev.heroBanner || DEFAULT_HERO), [field]: value },
      };
    });
  };

  const toggleFeaturedProduct = (productId: number) => {
    setData((prev) => {
      if (!prev) return prev;
      const current = prev.featuredProductIds || [];
      const next = current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId];
      return { ...prev, featuredProductIds: next };
    });
  };

  const toggleCategoryDisplay = (categoryId: number) => {
    setData((prev) => {
      if (!prev) return prev;
      const current = prev.categoriesSection?.display_categories || [];
      const next = current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId];
      return { ...prev, categoriesSection: { display_categories: next } };
    });
  };

  const updateWhyChooseUs = (items: WhyChooseItem[]) => {
    setData((prev) => (prev ? { ...prev, whyChooseUs: items } : prev));
  };

  const addWhyChooseItem = () => {
    updateWhyChooseUs([
      ...(data?.whyChooseUs || []),
      { icon: "Star", title: "", description: "" },
    ]);
  };

  const removeWhyChooseItem = (index: number) => {
    const items = data?.whyChooseUs || [];
    updateWhyChooseUs(items.filter((_, i) => i !== index));
  };

  const updateWhyChooseField = (
    index: number,
    field: keyof WhyChooseItem,
    value: string
  ) => {
    const items = [...(data?.whyChooseUs || [])];
    items[index] = { ...items[index], [field]: value };
    updateWhyChooseUs(items);
  };

  const moveWhyChooseItem = (index: number, direction: "up" | "down") => {
    const items = [...(data?.whyChooseUs || [])];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    [items[index], items[targetIdx]] = [items[targetIdx], items[index]];
    updateWhyChooseUs(items);
  };

  const updateMaxReviews = (value: number) => {
    const clamped = Math.max(1, Math.min(20, value));
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        customerReviews: { max_reviews_to_show: clamped },
      };
    });
  };

  const updateFooter = (field: string, value: string) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        footer: { ...(prev.footer || DEFAULT_FOOTER), [field]: value },
      };
    });
  };

  const updateSocialLink = (platform: string, value: string) => {
    setData((prev) => {
      if (!prev) return prev;
      const footer = prev.footer || DEFAULT_FOOTER;
      return {
        ...prev,
        footer: {
          ...footer,
          social_links: {
            ...(footer.social_links || { instagram: "", facebook: "" }),
            [platform]: value,
          },
        },
      };
    });
  };

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!data) return;
    setIsSaving(true);
    setSaveProgress(0);
    
    // Simulate progress
    const interval = setInterval(() => {
      setSaveProgress((prev) => Math.min(prev + 10, 90));
    }, 200);

    try {
      const featuredIds = data.featuredProductIds || [];
      if (featuredIds.length > 0 && featuredIds.length < 3) {
        toast.warning("Consider selecting at least 3 featured products for best display", {
          duration: 5000,
        });
      }

      const res = await fetch("/api/admin/homepage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heroBanner: data.heroBanner,
          featuredProductIds: data.featuredProductIds,
          categoriesSection: data.categoriesSection,
          whyChooseUs: data.whyChooseUs,
          customerReviews: data.customerReviews || DEFAULT_REVIEWS,
          footer: data.footer,
        }),
      });

      setSaveProgress(100);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save homepage content");
      }

      toast.success("✅ Homepage content saved successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save homepage content"
      );
    } finally {
      clearInterval(interval);
      setIsSaving(false);
      setTimeout(() => setSaveProgress(0), 1000);
    }
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-72 mt-1" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-destructive/5 rounded-full blur-2xl" />
          <AlertCircle className="h-16 w-16 text-destructive/50 relative" />
        </div>
        <h3 className="text-lg font-medium mt-4">Failed to load homepage content</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          {error || "No data returned from the server"}
        </p>
        <Button onClick={fetchAll} className="mt-6 min-h-11 rounded-full px-6">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </motion.div>
    );
  }

  const hero = data.heroBanner || DEFAULT_HERO;
  const featuredIds = data.featuredProductIds || [];
  const displayCategories = data.categoriesSection?.display_categories || [];
  const whyItems = data.whyChooseUs || [];
  const maxReviews = data.customerReviews?.max_reviews_to_show ?? 6;
  const footer = data.footer || DEFAULT_FOOTER;
  const publishedProducts = products.filter((p) => p.isPublished === true);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent rounded-2xl border">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Homepage Content Editor
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure the sections displayed on your storefront homepage
          </p>
        </div>
        <div className="flex items-center gap-3">
          {data.updatedAt && (
            <span className="text-xs text-muted-foreground">
              Last updated: {new Date(data.updatedAt).toLocaleString()}
            </span>
          )}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="min-h-11 min-w-32 rounded-full shadow-lg shadow-primary/20"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Save Progress */}
      <AnimatePresence>
        {isSaving && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Saving changes...</span>
                <span className="font-medium">{saveProgress}%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
  <div 
    className="h-full bg-primary rounded-full transition-all duration-500"
    style={{ width: `${saveProgress}%` }}
  />
</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {publishedProducts.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-400"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>No published products found. Publish at least 3 products to feature them on the homepage.</span>
        </motion.div>
      )}

      {/* Section A: Hero Banner */}
      <Collapsible
        open={openSections.hero}
        onOpenChange={() => toggleSection("hero")}
      >
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CollapsibleTrigger className="w-full" asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <ImageIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <CardTitle className="text-base">Hero Banner</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Main banner image, headline, and call-to-action
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {hero.image_url && (
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
                      Configured
                    </Badge>
                  )}
                  <ChevronDown
                    className={`h-5 w-5 text-muted-foreground transition-transform ${
                      openSections.hero ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="hero-image" className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    Image URL
                  </Label>
                  <Input
                    id="hero-image"
                    value={hero.image_url}
                    onChange={(e) => updateHero("image_url", e.target.value)}
                    placeholder="https://example.com/hero-banner.jpg"
                    className="min-h-11 rounded-xl"
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="hero-text">Banner Text</Label>
                  <Textarea
                    id="hero-text"
                    value={hero.text}
                    onChange={(e) => updateHero("text", e.target.value)}
                    placeholder="Welcome to our store"
                    rows={3}
                    className="min-h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero-cta-text">CTA Button Text</Label>
                  <Input
                    id="hero-cta-text"
                    value={hero.cta_text}
                    onChange={(e) => updateHero("cta_text", e.target.value)}
                    placeholder="Shop Now"
                    className="min-h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero-cta-link">CTA Button Link</Label>
                  <Input
                    id="hero-cta-link"
                    value={hero.cta_link}
                    onChange={(e) => updateHero("cta_link", e.target.value)}
                    placeholder="/products"
                    className="min-h-11 rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section B: Featured Products */}
      <Collapsible
        open={openSections.featured}
        onOpenChange={() => toggleSection("featured")}
      >
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CollapsibleTrigger className="w-full" asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Star className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <CardTitle className="text-base">Featured Products</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {featuredIds.length} product{featuredIds.length !== 1 ? "s" : ""}{" "}
                      selected (recommended: 3-6)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {featuredIds.length} / {Math.min(publishedProducts.length, 6)}
                  </Badge>
                  <ChevronDown
                    className={`h-5 w-5 text-muted-foreground transition-transform ${
                      openSections.featured ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <Separator className="mb-4" />
              {publishedProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Package className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-medium">No published products found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Publish at least one product to feature it on the homepage
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4 min-h-9 rounded-full"
                    onClick={() => window.location.href = "/admin/products"}
                  >
                    Go to Products
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-muted-foreground">
                      Select products to display in the featured section
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {featuredIds.length} selected
                    </Badge>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-1 pr-2">
                    {publishedProducts.map((product) => {
                      const isSelected = featuredIds.includes(product.id);
                      return (
                        <motion.label
                          key={product.id}
                          whileHover={{ x: 4 }}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
                            isSelected 
                              ? "bg-primary/5 border border-primary/20" 
                              : "hover:bg-muted/30"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleFeaturedProduct(product.id)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            aria-label={`Select ${product.name}`}
                          />
                          <span className="text-sm font-medium flex-1">
                            {product.name}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            ID: {product.id}
                          </Badge>
                          {isSelected && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                        </motion.label>
                      );
                    })}
                  </div>
                  {featuredIds.length > 0 && featuredIds.length < 3 && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-3 flex items-center gap-1 bg-yellow-500/10 px-3 py-2 rounded-lg">
                      <AlertCircle className="h-3 w-3" />
                      Consider selecting at least 3 products for better display
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section C: Categories Section */}
      <Collapsible
        open={openSections.categories}
        onOpenChange={() => toggleSection("categories")}
      >
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CollapsibleTrigger className="w-full" asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <LayoutGrid className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <CardTitle className="text-base">Categories Section</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {displayCategories.length} categories displayed
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {displayCategories.length} / {categories.length}
                  </Badge>
                  <ChevronDown
                    className={`h-5 w-5 text-muted-foreground transition-transform ${
                      openSections.categories ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <Separator className="mb-4" />
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No categories found. Create categories first.
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-1 pr-2">
                  {categories.map((category) => {
                    const isVisible = displayCategories.includes(category.id);
                    return (
                      <motion.div
                        key={category.id}
                        whileHover={{ x: 4 }}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                          isVisible ? "bg-primary/5 border border-primary/20" : "hover:bg-muted/30"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={isVisible}
                            onCheckedChange={() =>
                              toggleCategoryDisplay(category.id)
                            }
                            aria-label={`Show ${category.name} on homepage`}
                          />
                          <span className="text-sm font-medium">
                            {category.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {category._count.products} product
                            {category._count.products !== 1 ? "s" : ""}
                          </Badge>
                          {isVisible && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section D: Why Choose Us */}
      <Collapsible
        open={openSections.whyChooseUs}
        onOpenChange={() => toggleSection("whyChooseUs")}
      >
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CollapsibleTrigger className="w-full" asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <CardTitle className="text-base">Why Choose Us</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {whyItems.length} item{whyItems.length !== 1 ? "s" : ""} configured
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {whyItems.length} items
                  </Badge>
                  <ChevronDown
                    className={`h-5 w-5 text-muted-foreground transition-transform ${
                      openSections.whyChooseUs ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              <Separator />
              {whyItems.length === 0 && (
                <p className="text-sm text-muted-foreground py-2 text-center">
                  No items yet. Add reasons why customers should choose you.
                </p>
              )}
              <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                <AnimatePresence>
                  {whyItems.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border rounded-xl p-4 space-y-3 bg-muted/10 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          Item #{index + 1}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveWhyChooseItem(index, "up")}
                            disabled={index === 0}
                            className="min-h-9 min-w-9 p-1 rounded-full hover:bg-primary/10"
                            aria-label={`Move item ${index + 1} up`}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveWhyChooseItem(index, "down")}
                            disabled={index === whyItems.length - 1}
                            className="min-h-9 min-w-9 p-1 rounded-full hover:bg-primary/10"
                            aria-label={`Move item ${index + 1} down`}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeWhyChooseItem(index)}
                            className="min-h-9 min-w-9 p-1 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
                            aria-label={`Remove item ${index + 1}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Icon Name</Label>
                          <Input
                            value={item.icon}
                            onChange={(e) =>
                              updateWhyChooseField(index, "icon", e.target.value)
                            }
                            placeholder="e.g. Truck, Shield, Star"
                            className="min-h-11 rounded-xl"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Title</Label>
                          <Input
                            value={item.title}
                            onChange={(e) =>
                              updateWhyChooseField(index, "title", e.target.value)
                            }
                            placeholder="e.g. Free Shipping"
                            className="min-h-11 rounded-xl"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Description</Label>
                          <Input
                            value={item.description}
                            onChange={(e) =>
                              updateWhyChooseField(index, "description", e.target.value)
                            }
                            placeholder="Brief description..."
                            className="min-h-11 rounded-xl"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              <Button
                variant="outline"
                onClick={addWhyChooseItem}
                className="min-h-11 rounded-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section E: Customer Reviews */}
      <Collapsible
        open={openSections.reviews}
        onOpenChange={() => toggleSection("reviews")}
      >
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CollapsibleTrigger className="w-full" asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Star className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <CardTitle className="text-base">Customer Reviews</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Showing up to {maxReviews} reviews
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground transition-transform ${
                    openSections.reviews ? "rotate-180" : ""
                  }`}
                />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <Separator className="mb-4" />
              <div className="max-w-xs space-y-2">
                <Label htmlFor="max-reviews" className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  Max Reviews to Show
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="max-reviews"
                    type="number"
                    min={1}
                    max={20}
                    value={maxReviews}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) updateMaxReviews(val);
                    }}
                    className="min-h-11 w-24 rounded-xl"
                  />
                  <span className="text-sm text-muted-foreground">
                    (1–20)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
                  Customer reviews are pulled automatically from verified purchases.
                </p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section F: FAQ Section */}
      <Collapsible
        open={openSections.faq}
        onOpenChange={() => toggleSection("faq")}
      >
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CollapsibleTrigger className="w-full" asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <HelpCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <CardTitle className="text-base">FAQ Section</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Information only
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground transition-transform ${
                    openSections.faq ? "rotate-180" : ""
                  }`}
                />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <Separator className="mb-4" />
              <div className="flex items-start gap-4 rounded-xl bg-muted/30 p-4 border">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <Info className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    FAQs are managed via the FAQ Manager
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use the FAQ Manager in the admin panel to add, edit, reorder,
                    and toggle frequently asked questions displayed on the homepage.
                  </p>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section G: Footer */}
      <Collapsible
        open={openSections.footer}
        onOpenChange={() => toggleSection("footer")}
      >
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CollapsibleTrigger className="w-full" asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Footprints className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <CardTitle className="text-base">Footer</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Contact info, social links, and copyright
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {footer.contact_text && (
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
                      Configured
                    </Badge>
                  )}
                  <ChevronDown
                    className={`h-5 w-5 text-muted-foreground transition-transform ${
                      openSections.footer ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="footer-contact" className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    Contact Text
                  </Label>
                  <Textarea
                    id="footer-contact"
                    value={footer.contact_text}
                    onChange={(e) =>
                      updateFooter("contact_text", e.target.value)
                    }
                    placeholder="Reach us at support@example.com"
                    rows={2}
                    className="min-h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="footer-instagram" className="flex items-center gap-2">
                    <Instagram className="h-4 w-4 text-pink-500" />
                    Instagram URL
                  </Label>
                  <Input
                    id="footer-instagram"
                    value={footer.social_links?.instagram ?? ""}
                    onChange={(e) =>
                      updateSocialLink("instagram", e.target.value)
                    }
                    placeholder="https://instagram.com/yourstore"
                    className="min-h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="footer-facebook" className="flex items-center gap-2">
                    <Facebook className="h-4 w-4 text-blue-500" />
                    Facebook URL
                  </Label>
                  <Input
                    id="footer-facebook"
                    value={footer.social_links?.facebook ?? ""}
                    onChange={(e) =>
                      updateSocialLink("facebook", e.target.value)
                    }
                    placeholder="https://facebook.com/yourstore"
                    className="min-h-11 rounded-xl"
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="footer-copyright">Copyright Text</Label>
                  <Input
                    id="footer-copyright"
                    value={footer.copyright_text}
                    onChange={(e) =>
                      updateFooter("copyright_text", e.target.value)
                    }
                    placeholder="© 2025 Indicore Originals. All rights reserved."
                    className="min-h-11 rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </motion.div>
  );
}