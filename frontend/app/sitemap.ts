import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/seo"
import { API_BASE, fetchAllProducts } from "@/lib/api"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/shop`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/collections`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/promotions`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ]

  let productRoutes: MetadataRoute.Sitemap = []
  if (API_BASE) {
    try {
      const products = await fetchAllProducts()
      productRoutes = products.map((p) => ({
        url: `${SITE_URL}/product/${p.slug}`,
        lastModified: new Date(p.createdAt),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }))
    } catch {
      
    }
  }

  return [...staticRoutes, ...productRoutes]
}
