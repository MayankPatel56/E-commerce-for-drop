import { Metadata } from "next";
import { Suspense } from "react";
import StorefrontHomepage from "@/components/store/storefront-homepage";
import { ProductDetailSkeleton } from "@/components/store/product-detail";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://www.indicoreoriginals.me";

// Force dynamic rendering so build doesn't require DB connection
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  let homepageContent = null;
  try {
    const db = await import("@/lib/db");
    homepageContent = await db.db.homepageContent.findUnique({
      where: { id: 1 },
    });
  } catch {
    // DB not available at build time — use fallback
  }

  const title = (homepageContent?.heroBanner?.text ?? "Curated Unique Products") + " — Indicore Originals";
  const description =
    "Shop curated unique products from Indicore Originals. Modern, mobile-first e-commerce with COD payment and free delivery across India.";

  const ogImage = homepageContent?.heroBanner?.image_url
    ? homepageContent.heroBanner.image_url.startsWith("http")
      ? homepageContent.heroBanner.image_url
      : `${SITE_URL}${homepageContent.heroBanner.image_url}`
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
      settingsMap[s.key] = { value: String(s.value?.value ?? s.value ?? "") };
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

    return {
      heroBanner: {
        image_url: homepageContent.heroBanner?.image_url ?? "",
        text: homepageContent.heroBanner?.text ?? "Curated Unique Products",
        cta_text: homepageContent.heroBanner?.cta_text ?? "Shop Now",
        cta_link: homepageContent.heroBanner?.cta_link ?? "/shop",
      },
      featuredProducts: (homepageContent.featuredProducts ?? []).map(simpleProduct),
      categories: (homepageContent.categories ?? []).map((c: any) => ({
        id: c.id ?? 0,
        name: c.name ?? "",
        slug: c.slug ?? "",
      })),
      whyChooseUs: (homepageContent.whyChooseUs ?? []).map((f: any) => ({
        icon: f.icon ?? "ShieldCheck",
        title: f.title ?? "",
        description: f.description ?? "",
      })),
      footer: {
        contact_text: homepageContent.footer?.contact_text ?? "Get in touch",
        social_links: homepageContent.footer?.social_links ?? {},
        copyright_text: homepageContent.footer?.copyright_text ?? "",
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