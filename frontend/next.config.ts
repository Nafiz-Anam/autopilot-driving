import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output — copies only necessary files into .next/standalone (required for Docker)
  output: "standalone",

  // Skip env validation during build (useful for CI/CD without real env vars)
  env: {
    SKIP_ENV_VALIDATION: process.env.SKIP_ENV_VALIDATION ?? "",
  },

  // Image optimisation — allow Google OAuth avatars and GitHub avatars
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },
    ],
  },

  // Turbopack config (Next.js 16 uses Turbopack by default)
  turbopack: {},
};

export default nextConfig;
