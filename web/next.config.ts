import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output bundles only what's needed to run — no node_modules zip.
  // Deploy package is ~15MB instead of ~300MB.
  output: "standalone",
};

export default nextConfig;
