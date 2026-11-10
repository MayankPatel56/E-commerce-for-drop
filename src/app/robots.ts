import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://www.indicoreoriginals.me";

  return {
    rules: {
      // Allow all crawlers
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/cart/", "/checkout/", "/customer/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}