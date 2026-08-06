"use client"

import { useMemo } from "react"
import { useStore } from "@/components/store/store-provider"
import { ProductGrid } from "@/components/product/product-grid"

export function PromotionsBrowser() {
  const { products, hydrated } = useStore()

  const onSale = useMemo(
    () =>
      products
        .filter((p) => typeof p.oldPrice === "number" && p.oldPrice > p.price)
        .sort((a, b) => {
          const da = a.oldPrice ? (a.oldPrice - a.price) / a.oldPrice : 0
          const db = b.oldPrice ? (b.oldPrice - b.price) / b.oldPrice : 0
          return db - da
        }),
    [products],
  )

  if (!hydrated) return null

  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 md:px-6">
      {onSale.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">No promotions available right now. Check back soon.</p>
      ) : (
        <ProductGrid products={onSale} />
      )}
    </section>
  )
}
