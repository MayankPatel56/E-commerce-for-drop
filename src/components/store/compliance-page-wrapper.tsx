"use client";

import { useStoreNavigate } from "@/hooks/useStoreNavigate";
import { CustomerProfile } from "@/components/store/customer-profile";
import { ContactPage } from "@/components/store/compliance-pages";
import { FaqPage } from "@/components/store/compliance-pages";
import { PrivacyPolicyPage } from "@/components/store/compliance-pages";
import { ReturnPolicyPage } from "@/components/store/compliance-pages";
import { TermsPage } from "@/components/store/compliance-pages";
import { TrackOrderPage } from "@/components/store/track-order-page";

export type CompliancePageKey = "profile" | "contact" | "faq" | "privacy" | "returns" | "terms" | "track-order";

/**
 * Client wrapper. Server pages pass only a plain string key (serializable);
 * the navigation callback is created here, on the client.
 */
export function CompliancePageWrapper({ page }: { page: CompliancePageKey }) {
  const navigate = useStoreNavigate();
  switch (page) {
    case "profile":
      return <CustomerProfile onNavigate={navigate} />;
    case "contact":
      return <ContactPage onNavigate={navigate} />;
    case "faq":
      return <FaqPage onNavigate={navigate} />;
    case "privacy":
      return <PrivacyPolicyPage onNavigate={navigate} />;
    case "returns":
      return <ReturnPolicyPage onNavigate={navigate} />;
    case "terms":
      return <TermsPage onNavigate={navigate} />;
    case "track-order":
      return <TrackOrderPage onNavigate={navigate} />;
  }
}