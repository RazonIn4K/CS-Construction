import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  poweredByHeader: false,

  // instrumentation.ts is now available by default in Next.js 16
  // No need for experimental.instrumentationHook

  images: {
    domains: [],
  },
};

export default nextConfig;
