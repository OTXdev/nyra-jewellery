import type { Metadata } from "next"
import { ProductDetail } from "@/components/product/product-detail"

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api").replace(/\/$/, "")

interface PageProps {
  params: Promise<{ slug: string }>
}

// No generateStaticParams: the catalog is dynamic now, so product pages
// render on request instead of being pre-built at build time.
export const dynamic = "force-dynamic"

async function getProduct(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/products/${slug}/`, { cache: "no-store" })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return { title: "Product" }
  return {
    title: product.name,
    description: product.description,
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params
  return <ProductDetail slug={slug} />
}
