"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { 
  Instagram, 
  Facebook, 
  Twitter, 
  Youtube, 
  Mail, 
  Phone, 
  MapPin,
  ArrowUpRight,
  ShieldCheck,
  Truck,
  RefreshCw,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface StoreFooterProps {
  footer: {
    contact_text?: string;
    social_links?: {
      instagram?: string;
      facebook?: string;
      twitter?: string;
      youtube?: string;
    };
    copyright_text?: string;
  } | null;
  onNavigate: (view: string, data?: Record<string, unknown>) => void;
}

const QUICK_LINKS = [
  { id: "home", label: "Home", icon: "🏠" },
  { id: "shop", label: "Shop", icon: "🛍️" },
  { id: "track-order", label: "Track Order", icon: "📦" },
  { id: "faq", label: "FAQ", icon: "❓" },
  { id: "about", label: "About Us", icon: "ℹ️" },
  { id: "contact", label: "Contact", icon: "📧" },
] as const;

const LEGAL_LINKS = [
  { id: "privacy", label: "Privacy Policy" },
  { id: "terms", label: "Terms & Conditions" },
  { id: "returns", label: "Return Policy" },
] as const;

const TRUST_BADGES = [
  { icon: Truck, label: "Free Delivery", description: "On orders above ₹499" },
  { icon: ShieldCheck, label: "Secure Payment", description: "100% safe checkout" },
  { icon: RefreshCw, label: "Easy Returns", description: "7-day return policy" },
  { icon: CreditCard, label: "COD Available", description: "Pay on delivery" },
];

export function StoreFooter({ footer, onNavigate }: StoreFooterProps) {
  const contactText = footer?.contact_text ?? "";
  const copyrightText =
    footer?.copyright_text ?? `© ${new Date().getFullYear()} Indicore Originals. All rights reserved.`;
  const instagramUrl = footer?.social_links?.instagram ?? "";
  const facebookUrl = footer?.social_links?.facebook ?? "";
  const twitterUrl = footer?.social_links?.twitter ?? "";
  const youtubeUrl = footer?.social_links?.youtube ?? "";

  const socialLinks = [
    { url: instagramUrl, icon: Instagram, label: "Instagram", color: "hover:text-pink-500" },
    { url: facebookUrl, icon: Facebook, label: "Facebook", color: "hover:text-blue-500" },
    { url: twitterUrl, icon: Twitter, label: "Twitter", color: "hover:text-sky-400" },
    { url: youtubeUrl, icon: Youtube, label: "YouTube", color: "hover:text-red-500" },
  ].filter((link) => link.url);

  return (
    <footer className="relative border-t border-white/5 bg-gradient-to-b from-black via-black to-neutral-900 text-white/70 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-orange-500/5 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-purple-500/5 blur-3xl" />
      </div>

      {/* Main footer content */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-6 xs:gap-7 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4 lg:gap-10">
          {/* Column 1: Brand */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Image
              src="/logo.png"
              alt="Indicore Originals"
              width={343}
              height={120}
              className="h-10 w-auto object-contain"
            />
            <p className="text-sm text-white/50 leading-relaxed max-w-xs">
              Curated original products crafted with quality and care. Discover
              unique items that stand out from the crowd.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-white/40">100% Authentic Products</span>
            </div>
          </motion.div>

          {/* Column 2: Quick Links */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/90">
              Quick Links
            </h3>
            <nav aria-label="Footer navigation">
              <ul className="space-y-1">
                {QUICK_LINKS.map((link) => (
                  <li key={link.id}>
                    <button
                      type="button"
                      onClick={() => onNavigate(link.id)}
                      className="group flex items-center gap-2 text-sm text-white/50 hover:text-orange-400 transition-all duration-200 min-h-[44px] w-full text-left rounded-lg px-2 hover:bg-white/5"
                    >
                      <span className="text-base">{link.icon}</span>
                      <span>{link.label}</span>
                      <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </motion.div>

          {/* Column 3: Legal */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/90">
              Legal
            </h3>
            <nav aria-label="Legal links">
              <ul className="space-y-1">
                {LEGAL_LINKS.map((link) => (
                  <li key={link.id}>
                    <button
                      type="button"
                      onClick={() => onNavigate(link.id)}
                      className="group flex items-center gap-2 text-sm text-white/50 hover:text-orange-400 transition-all duration-200 min-h-[44px] w-full text-left rounded-lg px-2 hover:bg-white/5"
                    >
                      <span>{link.label}</span>
                      <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </motion.div>

          {/* Column 4: Contact & Social */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/90">
              Contact
            </h3>
            {contactText && (
              <div className="space-y-2 text-sm text-white/50 leading-relaxed">
                {contactText.split('\n').map((line, index) => (
                  <p key={index} className="flex items-start gap-2">
                    {index === 0 ? <Mail className="h-4 w-4 mt-0.5 text-orange-400" /> : 
                     index === 1 ? <Phone className="h-4 w-4 mt-0.5 text-orange-400" /> :
                     <MapPin className="h-4 w-4 mt-0.5 text-orange-400" />}
                    {line}
                  </p>
                ))}
              </div>
            )}

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-wider text-white/40">
                  Follow Us
                </p>
                <div className="flex items-center gap-2">
                  {socialLinks.map((social) => {
                    const Icon = social.icon;
                    return (
                      <a
                        key={social.label}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`group flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-white/5 text-white/50 transition-all duration-300 hover:bg-white/10 ${social.color}`}
                        aria-label={`Follow us on ${social.label}`}
                      >
                        <Icon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Trust Badges */}
        <motion.div 
          className="mt-8 xs:mt-10 sm:mt-12 grid grid-cols-1 gap-3 xs:grid-cols-2 xs:gap-2.5 sm:grid-cols-4 sm:gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {TRUST_BADGES.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <div
                key={index}
                className="flex items-center gap-3 rounded-xl bg-white/5 p-3 backdrop-blur-sm transition-all duration-300 hover:bg-white/10"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10 text-orange-400">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-white/80">{badge.label}</p>
                  <p className="text-[10px] text-white/40">{badge.description}</p>
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Newsletter Section */}
        <motion.div 
          className="mt-12 rounded-2xl bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent border border-white/5 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold text-white">Subscribe to our newsletter</h4>
              <p className="text-xs text-white/50">Get the latest updates on new products and offers</p>
            </div>
            <div className="flex w-full sm:w-auto gap-2">
              <Input
                type="email"
                placeholder="Enter your email"
                className="min-h-[44px] bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-orange-400 rounded-full flex-1 sm:w-64"
              />
              <Button className="min-h-[44px] rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20">
                Subscribe
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom bar */}
      <Separator className="bg-white/5" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-white/40 text-center sm:text-left">
            {copyrightText}
          </p>
          <div className="flex items-center gap-4 text-xs text-white/30">
            <span>Made with ❤️ in India</span>
            <span className="hidden sm:inline">|</span>
            <span className="flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Live
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}