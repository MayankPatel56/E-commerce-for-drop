"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
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
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Product {
  id: number;
  name: string;
  isPublished: boolean;
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
        fetch("/api/admin/products?limit=100"),
        fetch("/api/admin/categories"),
      ]);

      if (!hpRes.ok) throw new Error("Failed to fetch homepage content");

      const hpData: HomepageData = await hpRes.json();
      setData(hpData);

      if (prodRes.ok) {
        const prodJson = await prodRes.json();
        setProducts(prodJson.products || []);
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
    try {
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

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save homepage content");
      }

      toast.success("Homepage content saved successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save homepage content"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
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
        <Skeleton className="h-11 w-32 ml-auto" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-destructive/50 mb-4" />
        <h3 className="text-lg font-medium">Failed to load homepage content</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {error || "No data returned from the server"}
        </p>
        <Button onClick={fetchAll} className="mt-4 min-h-11">
          Try Again
        </Button>
      </div>
    );
  }

  const hero = data.heroBanner || DEFAULT_HERO;
  const featuredIds = data.featuredProductIds || [];
  const displayCategories = data.categoriesSection?.display_categories || [];
  const whyItems = data.whyChooseUs || [];
  const maxReviews = data.customerReviews?.max_reviews_to_show ?? 6;
  const footer = data.footer || DEFAULT_FOOTER;

  // Only show published products in the featured products selector
  const publishedProducts = products.filter((p) => p.isPublished);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          Homepage Content Editor
        </h2>
        <p className="text-sm text-muted-foreground">
          Configure the sections displayed on your storefront homepage
        </p>
      </div>

      {/* Section A: Hero Banner */}
      <Collapsible
        open={openSections.hero}
        onOpenChange={() => toggleSection("hero")}
      >
        <Card>
          <CollapsibleTrigger className="w-full" asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ImageIcon className="h-5 w-5 text-primary shrink-0" />
                  <div className="text-left">
                    <CardTitle className="text-base">Hero Banner</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Main banner image, headline, and call-to-action
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground transition-transform ${
                    openSections.hero ? "rotate-180" : ""
                  }`}
                />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="hero-image">Image URL</Label>
                  <Input
                    id="hero-image"
                    value={hero.image_url}
                    onChange={(e) => updateHero("image_url", e.target.value)}
                    placeholder="https://example.com/hero-banner.jpg"
                    className="min-h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero-text">Banner Text</Label>
                  <Textarea
                    id="hero-text"
                    value={hero.text}
                    onChange={(e) => updateHero("text", e.target.value)}
                    placeholder="Welcome to our store"
                    rows={3}
                    className="min-h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero-cta-text">CTA Button Text</Label>
                  <Input
                    id="hero-cta-text"
                    value={hero.cta_text}
                    onChange={(e) => updateHero("cta_text", e.target.value)}
                    placeholder="Shop Now"
                    className="min-h-11"
                  />
                  <Label htmlFor="hero-cta-link" className="mt-3">
                    CTA Button Link
                  </Label>
                  <Input
                    id="hero-cta-link"
                    value={hero.cta_link}
                    onChange={(e) => updateHero("cta_link", e.target.value)}
                    placeholder="/products"
                    className="min-h-11"
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
        <Card>
          <CollapsibleTrigger className="w-full" asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-primary shrink-0" />
                  <div className="text-left">
                    <CardTitle className="text-base">Featured Products</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {featuredIds.length} product{featuredIds.length !== 1 ? "s" : ""}{" "}
                      selected
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground transition-transform ${
                    openSections.featured ? "rotate-180" : ""
                  }`}
                />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <Separator className="mb-4" />
              {publishedProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No published products found. Publish products first.
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {publishedProducts.map((product) => {
                    const isSelected = featuredIds.includes(product.id);
                    return (
                      <label
                        key={product.id}
                        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 cursor-pointer min-h-11"
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
                      </label>
                    );
                  })}
                </div>
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
        <Card>
          <CollapsibleTrigger className="w-full" asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <LayoutGrid className="h-5 w-5 text-primary shrink-0" />
                  <div className="text-left">
                    <CardTitle className="text-base">
                      Categories Section
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Toggle categories to display on homepage
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground transition-transform ${
                    openSections.categories ? "rotate-180" : ""
                  }`}
                />
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
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {categories.map((category) => {
                    const isVisible = displayCategories.includes(category.id);
                    return (
                      <div
                        key={category.id}
                        className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-muted/50 min-h-11"
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
                            ID: {category.id}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {category._count.products} product
                            {category._count.products !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
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
        <Card>
          <CollapsibleTrigger className="w-full" asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-primary shrink-0" />
                  <div className="text-left">
                    <CardTitle className="text-base">Why Choose Us</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {whyItems.length} item{whyItems.length !== 1 ? "s" : ""}{" "}
                      configured
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground transition-transform ${
                    openSections.whyChooseUs ? "rotate-180" : ""
                  }`}
                />
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
              <div className="max-h-96 overflow-y-auto space-y-4">
                {whyItems.map((item, index) => (
                  <div
                    key={index}
                    className="border rounded-md p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Item {index + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveWhyChooseItem(index, "up")}
                          disabled={index === 0}
                          className="min-h-9 min-w-9 p-1"
                          aria-label={`Move item ${index + 1} up`}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveWhyChooseItem(index, "down")}
                          disabled={index === whyItems.length - 1}
                          className="min-h-9 min-w-9 p-1"
                          aria-label={`Move item ${index + 1} down`}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeWhyChooseItem(index)}
                          className="min-h-9 min-w-9 p-1 text-destructive hover:text-destructive"
                          aria-label={`Remove item ${index + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label>Icon Name</Label>
                        <Input
                          value={item.icon}
                          onChange={(e) =>
                            updateWhyChooseField(index, "icon", e.target.value)
                          }
                          placeholder="e.g. Truck, Shield, Star"
                          className="min-h-11"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Title</Label>
                        <Input
                          value={item.title}
                          onChange={(e) =>
                            updateWhyChooseField(index, "title", e.target.value)
                          }
                          placeholder="e.g. Free Shipping"
                          className="min-h-11"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Description</Label>
                         <Input
                          value={item.description}
                           onChange={(e) =>
                            updateWhyChooseField(index,"description",e.target.value)
                         }
                         placeholder="Brief description..."
                         className="min-h-11"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={addWhyChooseItem}
                className="min-h-11"
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
        <Card>
          <CollapsibleTrigger className="w-full" asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-primary shrink-0" />
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
                <Label htmlFor="max-reviews">
                  Max Reviews to Show
                </Label>
                <div className="flex items-center gap-2">
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
                    className="min-h-11 w-24"
                  />
                  <span className="text-sm text-muted-foreground">
                    (1–20)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Customer reviews are pulled automatically from verified
                  purchases.
                </p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section F: FAQ Section (Read-Only Info) */}
      <Collapsible
        open={openSections.faq}
        onOpenChange={() => toggleSection("faq")}
      >
        <Card>
          <CollapsibleTrigger className="w-full" asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-5 w-5 text-primary shrink-0" />
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
              <div className="flex items-start gap-3 rounded-md bg-muted/50 p-4">
                <Info className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">
                    FAQs are managed via the FAQ Manager
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use the FAQ Manager in the admin panel to add, edit, reorder,
                    and toggle frequently asked questions displayed on the
                    homepage.
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
        <Card>
          <CollapsibleTrigger className="w-full" asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Footprints className="h-5 w-5 text-primary shrink-0" />
                  <div className="text-left">
                    <CardTitle className="text-base">Footer</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Contact info, social links, and copyright
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground transition-transform ${
                    openSections.footer ? "rotate-180" : ""
                  }`}
                />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="footer-contact">Contact Text</Label>
                  <Textarea
                    id="footer-contact"
                    value={footer.contact_text}
                    onChange={(e) =>
                      updateFooter("contact_text", e.target.value)
                    }
                    placeholder="Reach us at support@example.com"
                    rows={2}
                    className="min-h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="footer-instagram">Instagram URL</Label>
                  <Input
                    id="footer-instagram"
                    value={footer.social_links?.instagram ?? ""}
                    onChange={(e) =>
                      updateSocialLink("instagram", e.target.value)
                    }
                    placeholder="https://instagram.com/yourstore"
                    className="min-h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="footer-facebook">Facebook URL</Label>
                  <Input
                    id="footer-facebook"
                    value={footer.social_links?.facebook ?? ""}
                    onChange={(e) =>
                      updateSocialLink("facebook", e.target.value)
                    }
                    placeholder="https://facebook.com/yourstore"
                    className="min-h-11"
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
                    className="min-h-11"
                  />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="min-h-11 min-w-30"
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
  );
}