import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!SITE.indexable) return [];
  return [{ url: SITE.url, lastModified: new Date(), changeFrequency: "monthly", priority: 1 }];
}
