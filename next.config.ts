import type { NextConfig } from "next";

/**
 * Routes that must never be indexed. Career results are built from answers in
 * the visitor's own browser session, so they have no meaningful public content.
 */
const privateRoutePatterns = ["/careers/results"];

const nextConfig: NextConfig = {
  // Learning material moved into the careers hub.
  async redirects() {
    return [
      { source: "/learn", destination: "/careers", permanent: true },
      // The community page was folded into the members page.
      { source: "/community", destination: "/team", permanent: true },
      // The members page was renamed to the team page.
      { source: "/members", destination: "/team", permanent: true },
      { source: "/learn/paths/:path", destination: "/careers/learning/:path", permanent: true },
      { source: "/learn/paths/:path/:rest*", destination: "/careers/learning/:path", permanent: true },
    ];
  },
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 414, 640, 768, 1024, 1280, 1536, 1920],
    qualities: [60, 75, 85],
  },
  // Content and manifest files are read from disk at request time; make sure
  // serverless bundles include them.
  outputFileTracingIncludes: {
    "/**/*": ["./content/**/*", "./config/**/*"],
  },
  serverExternalPackages: ["sharp", "@prisma/client"],
  async headers() {
    const security = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=()",
      },
    ];
    return [
      { source: "/:path*", headers: security },
      ...privateRoutePatterns.map((source) => ({
        source,
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      })),
    ];
  },
};

export default nextConfig;
