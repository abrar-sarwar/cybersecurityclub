import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/questionnaire",
          "/projects",
          "/lab-setup",
          "/certifications",
          "/interview-prep",
          "/account",
          "/pending",
          "/admin",
          "/dev",
          "/api",
          "/media",
          "/sign-in",
          "/sign-up",
          "/verify-email",
          "/forgot-password",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
