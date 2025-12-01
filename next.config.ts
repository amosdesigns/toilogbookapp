import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  } as Record<string, unknown>,
};

export default nextConfig;
