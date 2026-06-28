"use client";

import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { Instagram, Facebook } from "lucide-react";

interface StoreFooterProps {
  footer: {
    contact_text?: string;
    social_links?: {
      instagram?: string;
      facebook?: string;
    };
    copyright_text?: string;
  } | null;
  onNavigate: (view: string, data?: Record<string, unknown>) => void;
}

const QUICK_LINKS = [
  { id: "home", label: "Home" },
  { id: "shop", label: "Shop" },
  { id: "track-order", label: "Track Order" },
  { id: "faq", label: "FAQ" },
  { id: "about", label: "About Us" },
  { id: "contact", label: "Contact" },
] as const;

const LEGAL_LINKS = [
  { id: "privacy", label: "Privacy Policy" },
  { id: "terms", label: "Terms & Conditions" },
  { id: "returns", label: "Return Policy" },
] as const;

export function StoreFooter({ footer, onNavigate }: StoreFooterProps) {
  const contactText = footer?.contact_text ?? "";
  const copyrightText =
    footer?.copyright_text ?? `\u00A9 ${new Date().getFullYear()} Indicore Originals. All rights reserved.`;
  const instagramUrl = footer?.social_links?.instagram ?? "";
  const facebookUrl = footer?.social_links?.facebook ?? "";

  return (
    <footer className="border-t border-white/10 bg-black text-white/70">
      {/* Main footer content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Column 1: Brand */}
          <div className="space-y-3">
            <Image
              src="/logo.png"
              alt="Indicore Originals"
              width={343}
              height={120}
              className="h-9 w-auto object-contain"
            />
            <p className="text-sm text-white/50 leading-relaxed max-w-xs">
              Curated original products crafted with quality and care. Discover
              unique items that stand out.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Quick Links
            </h3>
            <nav aria-label="Footer navigation">
              <ul className="space-y-2">
                {QUICK_LINKS.map((link) => (
                  <li key={link.id}>
                    <button
                      type="button"
                      onClick={() => onNavigate(link.id)}
                      className="text-sm text-white/50 hover:text-orange-400 transition-colors min-h-[44px] flex items-center w-full text-left"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Column 3: Legal */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Legal
            </h3>
            <nav aria-label="Legal links">
              <ul className="space-y-2">
                {LEGAL_LINKS.map((link) => (
                  <li key={link.id}>
                    <button
                      type="button"
                      onClick={() => onNavigate(link.id)}
                      className="text-sm text-white/50 hover:text-orange-400 transition-colors min-h-[44px] flex items-center w-full text-left"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Column 4: Contact & Social */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Contact
            </h3>
            {contactText && (
              <p className="text-sm text-white/50 leading-relaxed whitespace-pre-line">
                {contactText}
              </p>
            )}
            {(instagramUrl || facebookUrl) && (
              <div className="flex items-center gap-2 pt-1">
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-md text-white/50 hover:text-orange-400 hover:bg-white/5 transition-colors"
                    aria-label="Follow us on Instagram"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {facebookUrl && (
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-md text-white/50 hover:text-orange-400 hover:bg-white/5 transition-colors"
                    aria-label="Follow us on Facebook"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <Separator className="bg-white/10" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
        <p className="text-xs text-white/40 text-center">
          {copyrightText}
        </p>
      </div>
    </footer>
  );
}