import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Store } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="max-w-lg space-y-6 text-center">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            404
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl">Page not found</h1>
          <p className="text-muted-foreground">
            The page you requested does not exist or has been removed.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild className="min-h-11">
            <Link href="/shop">
              <Store className="h-4 w-4" />
              Go to Shop
            </Link>
          </Button>
          <Button asChild variant="outline" className="min-h-11">
            <Link href="/">
              <Home className="h-4 w-4" />
              Go Home
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}