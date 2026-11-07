import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.indicoreoriginals.me";

  const routes = [
    "/",
    "/shop",
    "/about",
    "/contact",
    "/faq",
    "/privacy",
    "/returns",
    "/terms",
    "/track-order",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [...routes];
}