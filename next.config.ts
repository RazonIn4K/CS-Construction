import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  poweredByHeader: false,

  // Enable instrumentation for Sentry
  experimental: {
    instrumentationHook: true,
  },

  images: {
    domains: [],
  },
};

export default nextConfig;
