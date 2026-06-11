import type { MetadataRoute } from "next";

const siteUrl = "https://grabix.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private/auth-gated areas - no SEO value, keep crawlers out.
      disallow: ["/admin", "/conta", "/sign-in", "/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
