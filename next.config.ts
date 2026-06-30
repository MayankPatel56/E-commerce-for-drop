import type { NextConfig } from "next";

const securityHeaders = [
  // ... your existing headers (unchanged)
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "origin-when-cross-origin",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co https://*.supabase.in",
      "frame-ancestors 'self'",
    ].join("; "),
  },
];

const nextConfig = {
  // output: "standalone", // Only for self-hosting, not needed on Vercel
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gefenowenqvlhbrfnibl.supabase.co", // replace with your actual Supabase project ID
        pathname: "/storage/v1/object/public/product-images/**",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
} as NextConfig;

export default nextConfig;