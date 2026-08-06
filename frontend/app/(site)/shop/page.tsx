import type { Metadata } from "next"
import { Suspense } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { ShopBrowser } from "@/components/shop/shop-browser"

export const metadata: Metadata = {
  title: "Shop All Jewellery",
  description:
    "Browse the full Nyra Jewellery collection of rings, necklaces, bracelets and sets. Filter by category, price and material.",
}

export default function ShopPage() {
  return (
    <div>
      <PageHeader
        eyebrow="The Collection"
        title="Shop All Jewellery"
        description="Discover handcrafted pieces made to be treasured. Filter by category, material and price to find your perfect adornment."
      />
      <Suspense fallback={null}>
        <ShopBrowser />
      </Suspense>
    </div>
  )
}
