import { Suspense } from "react";
import HomePageClient from "../HomePageClient";

export default function ShopPage() {
  return (
    <Suspense fallback={null}>
      <HomePageClient />
    </Suspense>
  );
}