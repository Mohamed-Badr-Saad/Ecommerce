import type { NextConfig } from "next";

const devAllowedOrigins = (process.env.DEV_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const supabaseImageHostname = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : undefined;
  } catch {
    return undefined;
  }
})();

const nextConfig: NextConfig = {
  allowedDevOrigins: devAllowedOrigins,
  experimental: {
    serverActions: {
      allowedOrigins: devAllowedOrigins,
    },
  },
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "i.pinimg.com",
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
      {
        protocol: "https",
        hostname: "**.ufs.sh",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      ...(supabaseImageHostname
        ? [{ protocol: "https" as const, hostname: supabaseImageHostname, pathname: "/storage/v1/object/public/talie-catalog/**" }]
        : []),
    ],
  },
};

export default nextConfig;
