import { Metadata } from "next";
import { CustomerProfile } from "@/components/store/customer-profile";
import { CompliancePageWrapper } from "@/components/store/compliance-page-wrapper";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://www.indicoreoriginals.me";

export const metadata: Metadata = {
  title: "Profile — My Account — Indicore Originals",
  description: "Manage your profile information at Indicore Originals.",
  openGraph: {
    title: "Profile — My Account — Indicore Originals",
    description: "Manage your profile information.",
    url: `${SITE_URL}/account/profile`,
    siteName: "Indicore Originals",
    type: "website",
  },
};

export default async function ProfilePage() {
  return (
    <CompliancePageWrapper>
      {(navigate) => <CustomerProfile onNavigate={navigate} />}
    </CompliancePageWrapper>
  );
}