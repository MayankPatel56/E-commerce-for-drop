import { Suspense } from "react";
import HomePageClient from "@/app/HomePageClient";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <Suspense fallback={null}>
      <HomePageClient initialView="product" initialProductSlug={slug} />
    </Suspense>
  );
}