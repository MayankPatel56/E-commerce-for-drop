const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  reactStrictMode: false,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gefenowenqvlhbrfnibl.supabase.co",
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
} satisfies NextConfig;