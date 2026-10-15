import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // The officer admin page is never for search engines.
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin"] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
