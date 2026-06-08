import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname || process.cwd()),
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  } as Record<string, unknown>,
};

export default nextConfig;
