import { Metadata } from "next";
import Image from "next/image";
import { fetchShopProducts } from "@/lib/simple-shop-data";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://www.indicoreoriginals.me";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const title = "Shop All Products — Indicore Originals";
  const description =
    "Browse our curated collection of unique products at Indicore Originals. COD available, free delivery across India.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/shop`,
      siteName: "Indicore Originals",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ShopPage() {
  const products = await fetchShopProducts();

  if (!products.length) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">No products found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="group border rounded-lg overflow-hidden hover:shadow-md transition-all duration-200"
          >
            <div className="relative aspect-square bg-muted overflow-hidden">
              {product.primaryImage ? (
                <Image
                  src={product.primaryImage}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-200 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="text-muted-foreground">No image</span>
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="text-sm font-medium line-clamp-2">
                {product.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                ₹{product.price.toLocaleString("en-IN")}
              </p>
              <a
                href={`/shop/products/${product.slug}`}
                className="inline-block mt-2 text-sm text-primary hover:underline"
              >
                View Product →
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}