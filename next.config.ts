import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  poweredByHeader: false,

  // instrumentation.ts is now available by default in Next.js 16
  // No need for experimental.instrumentationHook

  // Explicitly set workspace root to avoid lockfile detection issues
  turbopack: {
    root: process.cwd(),
  },

  images: {
    domains: [],
  },
};

export default nextConfig;
