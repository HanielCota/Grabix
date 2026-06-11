import type { MetadataRoute } from "next";

// Canonical origin, mirrored from layout.tsx's metadataBase. Only public,
// indexable pages belong here - /conta, /sign-in and /admin are intentionally
// excluded (private or auth-gated).
const siteUrl = "https://grabix.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: siteUrl, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/pricing`, lastModified, changeFrequency: "monthly", priority: 0.8 },
  ];
}
