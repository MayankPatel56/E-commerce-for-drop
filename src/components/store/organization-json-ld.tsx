import type { ReactNode } from "react";

/**
 * Generates schema.org Organization + Website JSON-LD markup.
 * Pass it to a server component via `dangerouslySetInnerHTML` from a metadata function,
 * or from a client component that uses `useEffect` to set the innerHTML of a <script>.
 *
 * Usage in metadata:
 *   ...OrganizationJsonLd({ organizationName: "...", organizationUrl: "..." })
 */
export function OrganizationJsonLd({
  organizationName,
  organizationUrl,
  website,
  description,
  logo,
}: {
  organizationName: string;
  organizationUrl: string;
  website: string;
  description?: string;
  logo?: string;
}): ReactNode {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: organizationName,
    url: organizationUrl,
    description: description || "",
    logo: logo || "",
  };

  if (website) {
    jsonLd["@type"] = "Organization"; // Already set above
    // Add WebSite as a separate item for completeness
    // This helps Google's Knowledge Graph andela
  }

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
    >
      {JSON.stringify(jsonLd)}
    </script>
  );
}