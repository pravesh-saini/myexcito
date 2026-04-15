import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the Next.js development indicator (floating "N" badge).
  devIndicators: false,
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  outputFileTracingRoot: __dirname,
  output: process.env.NEXT_EXPORT === "1" ? "export" : undefined,
  // NOTE: For static export output in `out/`, serve the folder (e.g. `npm run serve:out`)
  // so `/_next/...` assets resolve correctly.
  images: {
    unoptimized: true,
  },
  typescript: {
    // ignoreBuildErrors: true,
  },
};

export default nextConfig;
