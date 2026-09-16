import type { NextConfig } from "next";

/**
 * Routes that must never be indexed. Private member content and officer tools
 * also enforce access on the server; this header is defence in depth for
 * crawlers that reach a redirect or a sign-in wall.
 */
const privateRoutePatterns = [
  "/dashboard/:path*",
  "/questionnaire/:path*",
  "/learn/paths/:path/:module/:lesson*",
  "/projects/:path*",
  "/lab-setup/:path*",
  "/certifications/:path*",
  "/interview-prep/:path*",
  "/account/:path*",
  "/onboarding/:path*",
  "/settings/:path*",
  "/auth/:path*",
  "/verify-student-email",
  "/unsubscribe",
  "/sign-in",
  "/admin/:path*",
  "/dev/:path*",
  "/media/:path*",
  "/api/:path*",
];

const nextConfig: NextConfig = {
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
  serverExternalPackages: ["sharp", "@prisma/client", "nodemailer"],
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
