"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import { StoreFooter } from "@/components/store/store-footer";

// ── Types ──────────────────────────────────────────────────────────────────

interface HomepageData {
  heroBanner: {
    image_url: string;
    text: string;
    cta_text: string;
    cta_link: string;
  };
  featuredProducts: {
    id: number;
    name: string;
    slug: string;
    price: number;
    primaryImage: string;
    category: { name: string; slug: string };
  }[];
  categories: {
    id: number;
    name: string;
    slug: string;
    _count: { products: number };
  }[];
  whyChooseUs: {
    icon: string;
    title: string;
    description: string;
  }[];
  customerReviews: { max_reviews_to_show: number };
  reviews: {
    id: number;
    rating: number;
    title: string;
    comment: string;
    reviewedAt: string;
    customerName: string;
    product: { name: string; slug: string };
  }[];
  footer: {
    contact_text: string;
    social_links: Record<string, string>;
    copyright_text: string;
  };
  settings: {
    store_name: { value: string };
  };
}

interface FaqItem {
  id: number;
  question: string;
  answer: string;
  displayOrder: number;
}

interface StorefrontHomepageProps {
  onNavigate: (view: string, data?: Record<string, unknown>) => void;
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
};

// ── Component ──────────────────────────────────────────────────────────────

export default function StorefrontHomepage({
  onNavigate,
}: StorefrontHomepageProps) {
  const [data, setData] = useState<HomepageData | null>(null);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [heroImageError, setHeroImageError] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [homeRes, faqRes] = await Promise.all([
          fetch("/api/homepage"),
          fetch("/api/faq"),
        ]);

        if (!homeRes.ok) {
          throw new Error("Failed to load homepage data");
        }

        const homeJson = await homeRes.json();
        setData(homeJson);

        if (faqRes.ok) {
          const faqJson = await faqRes.json();
          setFaqs(Array.isArray(faqJson) ? faqJson : []);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // ── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <LoadingSkeleton />
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="size-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error ?? "Unable to load homepage."}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const storeName = data.settings?.store_name?.value ?? "Indicore Originals";

  return (
    <div className="min-h-screen bg-white">
      {/* ── Section 1: Hero Banner ─────────────────────────────────────── */}
      <section className="relative flex min-h-[300px] items-center justify-center md:min-h-[400px] lg:min-h-[480px]">
        {data.heroBanner?.image_url && !heroImageError ? (
          <Image
            src={data.heroBanner.image_url}
            alt={data.heroBanner.text || storeName}
            fill
            className="object-cover"
            priority
            onError={() => setHeroImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-200 to-neutral-300" />
        )}
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="mb-4 text-3xl font-bold text-white drop-shadow-md sm:text-4xl md:text-5xl">
            {data.heroBanner?.text || "Welcome to Indicore Originals"}
          </h1>
          {data.heroBanner?.cta_text && (
            <Button
              size="lg"
              className="mt-2 min-h-[44px] text-base font-semibold"
              onClick={() => onNavigate("shop")}
            >
              {data.heroBanner.cta_text}
              <ArrowRight className="ml-1 size-4" />
            </Button>
          )}
        </div>
      </section>

      {/* ── Section 2: Featured Products ───────────────────────────────── */}
      <section className="py-12 md:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between md:mb-10">
            <h2 className="text-2xl font-bold md:text-3xl">Featured Products</h2>
            <Button
              variant="ghost"
              className="hidden gap-1 text-sm sm:inline-flex"
              onClick={() => onNavigate("shop")}
            >
              Shop All <ChevronRight className="size-4" />
            </Button>
          </div>

          {data.featuredProducts && data.featuredProducts.length > 0 ? (
            <>
              {/* Mobile: horizontal scroll */}
              <div className="flex gap-4 overflow-x-auto pb-4 sm:hidden snap-x snap-mandatory scrollbar-hide">
                {data.featuredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>

              {/* Desktop: grid */}
              <div className="hidden grid-cols-2 gap-4 sm:grid md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
                {data.featuredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>

              {/* Mobile "Shop All" button */}
              <div className="mt-6 text-center sm:hidden">
                <Button
                  variant="outline"
                  className="gap-1"
                  onClick={() => onNavigate("shop")}
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
      {data.categories && data.categories.length > 0 && (
        <section className="bg-neutral-50 py-12 md:py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-8 text-center text-2xl font-bold md:mb-10 md:text-3xl">
              Shop by Category
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
              {data.categories.map((cat) => (
                <Card
                  key={cat.id}
                  className="cursor-pointer rounded-lg transition-shadow hover:shadow-lg"
                  onClick={() =>
                    onNavigate("shop", { category: cat.slug })
                  }
                >
                  <CardContent className="flex items-center justify-between p-5 md:p-6">
                    <div>
                      <h3 className="font-semibold">{cat.name}</h3>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {cat._count?.products ?? 0} product
                        {(cat._count?.products ?? 0) !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {cat._count?.products ?? 0}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Section 4: Why Choose Us ───────────────────────────────────── */}
      {data.whyChooseUs && data.whyChooseUs.length > 0 && (
        <section className="py-12 md:py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-8 text-center text-2xl font-bold md:mb-10 md:text-3xl">
              Why Choose Us
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {data.whyChooseUs.map((usp, idx) => {
                const IconComp = iconMap[usp.icon] ?? Package;
                return (
                  <Card key={idx} className="rounded-lg">
                    <CardContent className="flex flex-col items-center p-6 text-center">
                      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10">
                        <IconComp className="size-6 text-primary" />
                      </div>
                      <h3 className="mb-1 font-semibold">{usp.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {usp.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Section 5: Customer Reviews ────────────────────────────────── */}
      <section className="bg-neutral-50 py-12 md:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-center text-2xl font-bold md:mb-10 md:text-3xl">
            What Our Customers Say
          </h2>

          {data.reviews && data.reviews.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {data.reviews.map((review) => (
                <Card key={review.id} className="rounded-lg">
                  <CardContent className="p-5 md:p-6">
                    {/* Star rating */}
                    <div className="mb-2 flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`size-4 ${
                            i < review.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-neutral-300"
                          }`}
                        />
                      ))}
                    </div>

                    {review.title && (
                      <h3 className="mb-1 font-semibold">{review.title}</h3>
                    )}
                    <p className="mb-3 text-sm text-muted-foreground line-clamp-3">
                      {review.comment}
                    </p>

                    <div className="mt-auto flex items-center justify-between border-t pt-3">
                      <span className="text-sm font-medium">
                        {review.customerName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {review.reviewedAt
                          ? new Date(review.reviewedAt).toLocaleDateString(
                              "en-IN",
                              { year: "numeric", month: "short", day: "numeric" }
                            )
                          : ""}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="py-16 text-center text-muted-foreground">
              No reviews yet
            </p>
          )}
        </div>
      </section>

      {/* ── Section 6: FAQ ─────────────────────────────────────────────── */}
      {faqs.length > 0 && (
        <section className="py-12 md:py-16 lg:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-8 text-center text-2xl font-bold md:mb-10 md:text-3xl">
              Frequently Asked Questions
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq) => (
                <AccordionItem key={faq.id} value={`faq-${faq.id}`}>
                  <AccordionTrigger className="text-left text-sm font-medium md:text-base">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      )}

      {/* ── Section 7: Footer ──────────────────────────────────────────── */}
      <StoreFooter footer={data.footer} onNavigate={onNavigate} />
    </div>
  );
}

// ── Product Card ───────────────────────────────────────────────────────────

function ProductCard({
  product,
  onNavigate,
}: {
  product: HomepageData["featuredProducts"][number];
  onNavigate: (view: string, data?: Record<string, unknown>) => void;
}) {
  return (
    <Card
      className="w-64 shrink-0 cursor-pointer snap-start rounded-lg transition-shadow hover:shadow-lg sm:w-auto"
      onClick={() => onNavigate("product", { slug: product.slug })}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-t-lg bg-neutral-100">
        {product.primaryImage ? (
          <Image
            src={product.primaryImage}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-200 hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Package className="size-10 text-neutral-300" />
          </div>
        )}
        {product.category?.name && (
          <Badge
            variant="secondary"
            className="absolute bottom-2 left-2 text-xs"
          >
            {product.category.name}
          </Badge>
        )}
      </div>
      <CardContent className="p-3 md:p-4">
        <h3 className="truncate text-sm font-semibold">{product.name}</h3>
        <p className="mt-1 text-sm font-bold text-primary">
          ₹{product.price.toLocaleString("en-IN")}
        </p>
      </CardContent>
    </Card>
  );
}

// ── Loading Skeleton ───────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <>
      {/* Hero skeleton */}
      <Skeleton className="h-[300px] w-full md:h-[400px]" />

      {/* Featured products skeleton */}
      <section className="py-12 md:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-8 w-20" />
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories skeleton */}
      <section className="bg-neutral-50 py-12 md:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Skeleton className="mx-auto mb-8 h-8 w-48 md:mb-10" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        </div>
      </section>

      {/* USPs skeleton */}
      <section className="py-12 md:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Skeleton className="mx-auto mb-8 h-8 w-48 md:mb-10" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        </div>
      </section>

      {/* Reviews skeleton */}
      <section className="bg-neutral-50 py-12 md:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Skeleton className="mx-auto mb-8 h-8 w-56 md:mb-10" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-lg" />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ skeleton */}
      <section className="py-12 md:py-16 lg:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Skeleton className="mx-auto mb-8 h-8 w-56 md:mb-10" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}