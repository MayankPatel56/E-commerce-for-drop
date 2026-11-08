"use client";

import { useRouter } from "next/navigation";

/**
 * Navigation hook for the storefront.
 * Maps logical view names to real route paths.
 * This replaces the old onNavigate prop that was passed through HomePageClient.
 */
export function useStoreNavigate() {
  const router = useRouter();

  const navigate = (view: string, data?: Record<string, unknown>) => {
    window.scrollTo(0, 0);

    switch (view) {
      case "home":
        router.push("/");
        break;

      case "shop":
        if (data?.category) {
          router.push(`/shop?category=${encodeURIComponent(data.category as string)}`);
        } else {
          router.push("/shop");
        }
        break;

      case "product":
        if (data?.slug) {
          router.push(`/shop/products/${data.slug}`);
        }
        break;

      case "search":
        router.push("/search");
        break;

      case "track-order":
        router.push("/track-order");
        break;

      case "checkout":
        router.push("/checkout");
        break;

      case "order-confirmation":
        if (data?.orderNumber) {
          router.push(`/order-confirmation/${data.orderNumber}`);
        } else {
          router.push("/order-confirmation");
        }
        break;

      case "customer-dashboard":
        router.push("/account");
        break;

      case "customer-profile":
        router.push("/account/profile");
        break;

      case "customer-wishlist":
        router.push("/account/wishlist");
        break;

      case "customer-orders":
        router.push("/account/orders");
        break;

      case "customer-reviews":
        router.push("/account/reviews");
        break;

      case "privacy":
        router.push("/privacy");
        break;

      case "terms":
        router.push("/terms");
        break;

      case "returns":
        router.push("/returns");
        break;

      case "about":
        router.push("/about");
        break;

      case "contact":
        router.push("/contact");
        break;

      case "faq":
        router.push("/faq");
        break;

      case "login":
        router.push("/login");
        break;

      case "signup":
        router.push("/signup");
        break;

      case "admin":
        router.push("/admin");
        break;

      default:
        console.warn(`[useStoreNavigate] Unknown view: ${view}`);
    }
  };

  return navigate;
}