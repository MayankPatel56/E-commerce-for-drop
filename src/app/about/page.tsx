import { Suspense } from "react";
import HomePageClient from "../HomePageClient";

export default function AboutPage() {
  return (
    <Suspense fallback={null}>
      <HomePageClient />
    </Suspense>
  );
}