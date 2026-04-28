import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output bundles only what's needed to run — no node_modules zip.
  // Deploy package is ~15MB instead of ~300MB.
  output: "standalone",
  images: {
    // Allow Supabase Storage URLs for evidence thumbnails in the HO review queue
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
};

export default nextConfig;
