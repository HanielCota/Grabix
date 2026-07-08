import type { MetadataRoute } from "next";

const siteUrl = "https://grabix.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private/auth-gated/API areas have no search value. Pages also set
      // noindex where they can render metadata.
      disallow: ["/admin", "/conta", "/sign-in", "/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
