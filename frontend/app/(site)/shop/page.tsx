import type { Metadata } from "next"
import { Suspense } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { ShopBrowser } from "@/components/shop/shop-browser"

export const metadata: Metadata = {
  title: "Shop All Jewellery",
  description:
    "Browse the full Nyra Jewellery collection of rings, necklaces, bracelets and sets in modern stainless steel. Filter by category, price and material.",
}

export default function ShopPage() {
  return (
    <div>
      <PageHeader
        eyebrow="The Collection"
        title="Shop All Jewellery"
        description="Discover our curated selection of modern stainless steel jewelry. Filter by category, material and price to find your perfect piece."
      />
      <Suspense fallback={null}>
        <ShopBrowser />
      </Suspense>
    </div>
  )
}
