import { db } from "@/lib/db";

// Minimal interfaces for initial fetch
interface SimpleCategory {
  id: number;
  name: string;
  slug: string;
}

interface SimpleProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  primaryImage: string | null;
  category: SimpleCategory | null;
}

/**
 * Fetch simplified product list for server-side shop page
 */
export async function fetchShopProducts(): Promise<SimpleProduct[]> {
  const products = await db.product.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { id: true, name: true, slug: true } },
    },
    take: 40,
  });

  return products.map(p => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    primaryImage: p.primaryImage,
    category: p.category,
  }));
}