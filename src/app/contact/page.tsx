import { Suspense } from "react";
import HomePageClient from "../HomePageClient";

export default function ContactPage() {
  return (
    <Suspense fallback={null}>
      <HomePageClient />
    </Suspense>
  );
}