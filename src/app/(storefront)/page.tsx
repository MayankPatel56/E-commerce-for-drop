import { Metadata } from "next";
import { Suspense } from "react";
import StorefrontHomepage from "@/components/store/storefront-homepage";
import { ProductDetailSkeleton } from "@/components/store/product-detail";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://www.indicoreoriginals.me";

// Force dynamic rendering so build doesn't require DB connection
export const dynamic = "force-dynamic";

interface JsonValue {
  [key: string]: JsonValue | string | number | boolean | null | JsonValue[];
}

interface HomepageContent {
  id: number;
  updatedAt: Date;
  heroBanner: JsonValue;
  featuredProductIds: JsonValue;
  categoriesSection: JsonValue;
  whyChooseUs: JsonValue;
  customerReviews: JsonValue;
  footer: JsonValue;
}

export async function generateMetadata(): Promise<Metadata> {
  let homepageContent: any = null;
  try {
    const db = await import("@/lib/db");
    homepageContent = await db.db.homepageContent.findUnique({
      where: { id: 1 },
    });
  } catch {
    // DB not available at build time — use fallback
  }

  const heroBanner = homepageContent?.heroBanner as JsonValue | undefined;
  const title = (heroBanner?.text as string ?? "Curated Unique Products") + " — Indicore Originals";
  const description =
    "Shop curated unique products from Indicore Originals. Modern, mobile-first e-commerce with COD payment and free delivery across India.";

  const ogImageUrl = heroBanner?.image_url as string | undefined;
  const ogImage = ogImageUrl
    ? ogImageUrl.startsWith("http")
      ? ogImageUrl
      : `${SITE_URL}${ogImageUrl}`
    : `${SITE_URL}/loko.png`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: SITE_URL,
      siteName: "Indicore Originals",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

// ── Server: fetch minimal homepage data for the component ──

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

interface SimpleHomepageData {
  heroBanner: SimpleHeroBanner;
  featuredProducts: SimpleFeaturedProduct[];
  categories: SimpleCategory[];
  whyChooseUs: SimpleWhyChooseUs[];
  footer: SimpleFooter;
}

async function fetchSimpleHomepageData(): Promise<SimpleHomepageData> {
  // Default fallback data
  const fallbackData: SimpleHomepageData = {
    heroBanner: {
      image_url: "",
      text: "Curated Unique Products",
      cta_text: "Shop Now",
      cta_link: "/shop",
    },
    featuredProducts: [],
    categories: [],
    whyChooseUs: [],
    footer: {
      contact_text: "Get in touch",
      social_links: {},
      copyright_text: "",
    },
  };

  try {
    const db = await import("@/lib/db");

    // Fetch singleton homepage content
    const homepageContent = await db.db.homepageContent.findUnique({
      where: { id: 1 },
    });

    if (!homepageContent) {
      return fallbackData;
    }

    // Fetch settings
    const storeSettings = await db.db.setting.findMany({
      where: { key: { in: ["store_name"] } },
    });
    const settingsMap: Record<string, { value: string }> = {};
    for (const s of storeSettings) {
      // Prisma setting model has value as JsonValue
      const val = s.value as unknown as { value?: string } | string;
      settingsMap[s.key] = { value: typeof val === "object" && val !== null ? (val.value ?? "") : String(val) };
    }

    const getSetting = (key: string): string => {
      const s = settingsMap[key];
      return s?.value ?? "";
    };

    // Format simple data - only serializable fields
    const simpleProduct = (p: any): SimpleFeaturedProduct => ({
      id: p.id ?? 0,
      name: p.name ?? "",
      slug: p.slug ?? "",
      price: p.price ?? 0,
      primaryImage: p.primaryImage ?? "",
      compareAtPrice: p.compareAtPrice,
      badgeText: p.badgeText,
      category: p.category ?? { name: "", slug: "" },
    });

    // Extract JSON data from homepageContent
    const heroBanner = homepageContent.heroBanner as JsonValue | undefined;
    const featuredProducts = homepageContent.featuredProductIds as JsonValue | undefined;
    const categories = homepageContent.categoriesSection as JsonValue | undefined;
    const whyChooseUs = homepageContent.whyChooseUs as JsonValue | undefined;
    const footer = homepageContent.footer as JsonValue | undefined;

    return {
      heroBanner: {
        image_url: (heroBanner?.image_url as string) ?? "",
        text: (heroBanner?.text as string) ?? "Curated Unique Products",
        cta_text: (heroBanner?.cta_text as string) ?? "Shop Now",
        cta_link: (heroBanner?.cta_link as string) ?? "/shop",
      },
      featuredProducts: ((featuredProducts as unknown as JsonValue[]) ?? []).map(simpleProduct),
      categories: ((categories as unknown as JsonValue[]) ?? []).map((c: JsonValue) => ({
        id: (c.id as number) ?? 0,
        name: (c.name as string) ?? "",
        slug: (c.slug as string) ?? "",
        productCount: (c.productCount as number) ?? 0,
      })),
      whyChooseUs: ((whyChooseUs as unknown as JsonValue[]) ?? []).map((f: JsonValue) => ({
        icon: (f.icon as string) ?? "ShieldCheck",
        title: (f.title as string) ?? "",
        description: (f.description as string) ?? "",
      })),
      footer: {
        contact_text: (footer?.contact_text as string) ?? "Get in touch",
        social_links: (footer?.social_links as Record<string, string>) ?? {},
        copyright_text: (footer?.copyright_text as string) ?? "",
      },
    };
  } catch {
    // DB not available at build time — return fallback
    return fallbackData;
  }
}

export default async function HomePage() {
  const data = await fetchSimpleHomepageData();

  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <StorefrontHomepage data={data} siteUrl={SITE_URL} />
    </Suspense>
  );
}