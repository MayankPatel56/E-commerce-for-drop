"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollReelTestimonials } from "@/components/ui/scroll-reel-testimonials";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Star,
  ArrowRight,
  ChevronRight,
  Truck,
  ShieldCheck,
  RefreshCw,
  Headphones,
  Package,
  Heart,
  Zap,
  Lock,
  BadgeCheck,
  AlertCircle,
  Sparkles,
  TrendingUp,
  Clock,
  Award,
  type LucideIcon,
} from "lucide-react";
import { StoreFooter } from "@/components/store/store-footer";
import { useStoreNavigate } from "@/hooks/useStoreNavigate";

// ── Types ──────────────────────────────────────────────────────────────────
interface SimpleHeroBanner {
  image_url: string;
  text: string;
  cta_text: string;
  cta_link: string;
}

interface SimpleFeaturedProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  primaryImage: string | null;
  compareAtPrice?: number | null;
  badgeText?: string | null;
  category: { name: string; slug: string };
}

interface SimpleCategory {
  id: number;
  name: string;
  slug: string;
  productCount: number;
}

interface SimpleWhyChooseUs {
  icon: string;
  title: string;
  description: string;
}

interface SimpleFooter {
  contact_text: string;
  social_links: Record<string, string>;
  copyright_text: string;
}

interface StorefrontHomepageProps {
  data: {
    heroBanner: SimpleHeroBanner;
    featuredProducts: SimpleFeaturedProduct[];
    categories: SimpleCategory[];
    whyChooseUs: SimpleWhyChooseUs[];
    footer: SimpleFooter;
  };
  siteUrl: string;
}

// ── Icon mapping ───────────────────────────────────────────────────────────

const iconMap: Record<string, LucideIcon> = {
  truck: Truck,
  "shield-check": ShieldCheck,
  "refresh-cw": RefreshCw,
  headphones: Headphones,
  package: Package,
  star: Star,
  heart: Heart,
  zap: Zap,
  lock: Lock,
  "badge-check": BadgeCheck,
};

// ── Component ──────────────────────────────────────────────────────────────

export default function StorefrontHomepage({
  data,
  siteUrl,
}: StorefrontHomepageProps) {
  const [heroImageError, setHeroImageError] = useState(false);
  const router = useRouter();
  const navigate = useStoreNavigate();

  const { heroBanner, featuredProducts, categories, whyChooseUs, footer } = data;

  const storeName = footer.contact_text ?? "Indicore Originals";

  return (
    <motion.div
      className="min-h-screen bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* ── Section 1: Hero Banner ─────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-black">
        {heroBanner.image_url && !heroImageError && (
          <Image
            src={heroBanner.image_url}
            alt={heroBanner.text || storeName}
            fill
            priority
            className="object-cover object-right"
            onError={() => setHeroImageError(true)}
          />
        )}

        <div className="absolute inset-0 bg-linear-to-r from-black via-black/85 to-black/30" />

        <div className="relative mx-auto flex min-h-115 max-w-7xl items-center px-4 py-16 sm:px-6 md:min-h-130 lg:min-h-150 lg:px-8">
          <motion.div
            className="max-w-xl text-left"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="inline-flex items-center gap-2 rounded-full bg-orange-500/20 px-4 py-1.5 text-sm font-medium text-orange-400 backdrop-blur-sm mb-4"
            >
              <Sparkles className="h-4 w-4" />
              New Collection
            </motion.div>

            <h1 className="text-2xl font-bold leading-tight text-white xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
              {heroBanner.text ? (
                heroBanner.text
              ) : (
                <>
                  Original Products.
                  <br />
                  Curated for{" "}
                  <span className="bg-linear-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">
                    Modern Living.
                  </span>
                </>
              )}
            </h1>
            <p className="mt-3 xs:mt-4 max-w-md text-sm xs:text-base sm:text-lg text-white/60">
              Unique, high-quality products selected for people who value
              originality.
            </p>
            <div className="mt-6 xs:mt-8 flex flex-col gap-2.5 xs:gap-3 sm:flex-row">
              {heroBanner.cta_text && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="lg"
                    className="min-h-12 xs:min-h-14 gap-2 bg-gradient-to-r from-orange-500 to-orange-400 px-6 xs:px-8 text-sm xs:text-base font-semibold text-black shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all rounded-lg xs:rounded-xl"
                    onClick={() => navigate("shop")}
                  >
                    {heroBanner.cta_text}
                    <ArrowRight className="size-4" />
                  </Button>
                </motion.div>
              )}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="min-h-[48px] border-white/30 bg-transparent px-8 text-base font-semibold text-white hover:bg-white/10 hover:border-white/50 transition-all"
                  onClick={() => navigate("shop")}
                >
                  Explore Categories
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Section 2: Featured Products ───────────────────────────────── */}
      <section className="py-12 md:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mb-8 flex items-center justify-between md:mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="h-[3px] w-6 bg-gradient-to-r from-orange-500 to-orange-400 rounded-full" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Best Sellers
                </span>
              </div>
              <h2 className="text-2xl font-bold md:text-3xl">Featured Products</h2>
            </div>
            <Button
              variant="ghost"
              className="hidden gap-1 text-sm sm:inline-flex group hover:text-orange-500"
              onClick={() => navigate("shop")}
            >
              Shop All
              <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>

          {featuredProducts && featuredProducts.length > 0 ? (
            <>
              <div className="flex gap-4 overflow-x-auto pb-4 sm:hidden snap-x snap-mandatory scrollbar-hide">
                {featuredProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    navigate={navigate}
                    index={index}
                  />
                ))}
              </div>

              <div className="hidden grid-cols-2 gap-4 sm:grid md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
                {featuredProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    navigate={navigate}
                    index={index}
                  />
                ))}
              </div>

              <div className="mt-6 text-center sm:hidden">
                <Button
                  variant="outline"
                  className="gap-1"
                  onClick={() => navigate("shop")}
                >
                  Shop All <ArrowRight className="size-4" />
                </Button>
              </div>
            </>
          ) : (
            <p className="py-16 text-center text-muted-foreground">
              No featured products available at the moment. Check back soon!
            </p>
          )}
        </div>
      </section>

      {/* ── Section 3: Categories ──────────────────────────────────────── */}
      {categories && categories.length > 0 && (
        <section className="bg-gradient-to-b from-neutral-50 to-white py-12 md:py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              className="mb-8 text-center md:mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="h-[3px] w-6 bg-gradient-to-r from-orange-500 to-orange-400 rounded-full" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Browse
                </span>
              </div>
              <h2 className="text-2xl font-bold md:text-3xl">Shop by Category</h2>
            </motion.div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
              {categories.map((cat, index) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                >
                  <Card
                    className="cursor-pointer rounded-2xl transition-all duration-300 hover:shadow-xl hover:border-orange-200"
                    onClick={() => navigate("shop", { category: cat.slug })}
                  >
                    <CardContent className="flex items-center justify-between p-5 md:p-6">
                      <div>
                        <h3 className="font-semibold">{cat.name}</h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {cat.productCount ?? 0} product
                          {(cat.productCount ?? 0) !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <Badge variant="secondary" className="rounded-full bg-orange-100 text-orange-700 hover:bg-orange-200">
                        {cat.productCount ?? 0}
                      </Badge>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Section 4: Customer Reviews ───────────────────────────────── */}
      <section className="py-12 md:py-16 lg:py-20">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mb-8 text-center md:mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="h-[3px] w-6 bg-gradient-to-r from-orange-500 to-orange-400 rounded-full" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Testimonials
              </span>
            </div>
            <h2 className="text-2xl font-bold md:text-3xl">What Our Customers Say</h2>
          </motion.div>

          {/* Simple review display without client-side fetching */}
          <div className="flex justify-center">
            {whyChooseUs && whyChooseUs.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                {/* Placeholder: show why choose us as "reviews" */}
                {whyChooseUs.map((usp, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                  >
                    <div className="flex items-center gap-3 text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/20">
                        <Package className="size-5 text-orange-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{usp.title}</p>
                        <p className="text-xs text-white/50">{usp.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <p className="py-16 text-center text-muted-foreground">
                No reviews yet
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── Section 5: FAQ ─────────────────────────────────────────────── */}
      {whyChooseUs && whyChooseUs.length > 0 && (
        <section className="bg-gradient-to-b from-white to-neutral-50 py-12 md:py-16 lg:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <motion.div
              className="mb-8 text-center md:mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="h-[3px] w-6 bg-gradient-to-r from-orange-500 to-orange-400 rounded-full" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Help
                </span>
              </div>
              <h2 className="text-2xl font-bold md:text-3xl">Frequently Asked Questions</h2>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Accordion type="single" collapsible className="w-full">
                {whyChooseUs.map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <AccordionItem value={`faq-${index}`} className="border-b border-neutral-200">
                      <AccordionTrigger className="text-left text-sm font-medium hover:text-orange-500 transition-colors md:text-base py-4">
                        {faq.title}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-4">
                        {faq.description}
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                ))}
              </Accordion>
            </motion.div>
          </div>
        </section>
      )}

      {/* ── Section 6: Footer ──────────────────────────────────────────── */}
      <StoreFooter footer={footer} />
    </motion.div>
  );
}

// ── Product Card ───────────────────────────────────────────────────────────

function ProductCard({
  product,
  navigate,
  index,
}: {
  product: SimpleFeaturedProduct;
  navigate: (view: string, data?: Record<string, unknown>) => void;
  index: number;
}) {
  const discountPercent = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
    >
      <Card
        className="w-64 shrink-0 cursor-pointer snap-start rounded-2xl transition-all duration-300 hover:shadow-xl hover:border-orange-200 sm:w-auto group"
        onClick={() => navigate("product", { slug: product.slug })}
      >
        <div className="relative aspect-square w-full overflow-hidden rounded-t-2xl bg-neutral-100">
          {product.primaryImage ? (
            <>
              <Image
                src={product.primaryImage}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Package className="size-10 text-neutral-300" />
            </div>
          )}

          {/* Badges */}
          {product.badgeText && (
            <Badge className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-orange-400 text-white border-0 shadow-lg">
              {product.badgeText}
            </Badge>
          )}

          {discountPercent > 0 && (
            <Badge className="absolute top-3 right-3 bg-red-500 text-white border-0 shadow-lg">
              {discountPercent}% OFF
            </Badge>
          )}

          {product.category?.name && (
            <Badge
              variant="secondary"
              className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-xs shadow-lg"
            >
              {product.category.name}
            </Badge>
          )}

          {/* Quick view button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              variant="secondary"
              size="sm"
              className="rounded-full shadow-lg bg-white/90 hover:bg-white text-black"
              onClick={(e) => {
                e.stopPropagation();
                navigate("product", { slug: product.slug });
              }}
            >
              Quick View
            </Button>
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="truncate text-sm font-semibold group-hover:text-orange-500 transition-colors">
            {product.name}
          </h3>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-sm font-bold text-primary">
              ₹{product.price.toLocaleString("en-IN")}
            </p>
            {product.compareAtPrice && (
              <p className="text-xs text-muted-foreground line-through">
                ₹{product.compareAtPrice.toLocaleString("en-IN")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Loading Skeleton ───────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <>
      <Skeleton className="h-[300px] w-full md:h-[400px]" />
      <section className="py-12 md:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-48" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-neutral-50 py-12 md:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <Skeleton className="mx-auto h-3 w-20" />
            <Skeleton className="mx-auto mt-1 h-8 w-48" />
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
      <section className="py-12 md:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <Skeleton className="mx-auto h-3 w-20" />
            <Skeleton className="mx-auto mt-1 h-8 w-56" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
      <section className="py-12 md:py-16 lg:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <Skeleton className="mx-auto h-3 w-20" />
            <Skeleton className="mx-auto mt-1 h-8 w-56" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}