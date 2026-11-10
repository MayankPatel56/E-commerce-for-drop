"use client";

import { useStoreNavigate } from "@/hooks/useStoreNavigate";

/**
 * Client wrapper that wires up a real navigation callback for compliance pages.
 * Compliance pages are server-rendered but their inner components expect an
 * `onNavigate` prop. This wrapper provides one backed by `useStoreNavigate()`
 * so clicks actually route to real pages instead of being no-ops.
 *
 * Usage:
 *   <CompliancePageWrapper>
 *     {(navigate) => <AboutPage onNavigate={navigate} />}
 *   </CompliancePageWrapper>
 */
export function CompliancePageWrapper({
  children,
}: {
  children: (
    navigate: (view: string, data?: Record<string, unknown>) => void,
  ) => React.ReactNode;
}) {
  const navigate = useStoreNavigate();
  return <>{children(navigate)}</>;
}