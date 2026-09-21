import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Results are built from answers in the visitor's own browser session.
        disallow: ["/careers/results"],
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
