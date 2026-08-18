import type { Metadata } from "next"
import { Suspense } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { ShopBrowser } from "@/components/shop/shop-browser"
export const dynamic = "force-dynamic"
export const metadata: Metadata = {
  title: "Tous les bijoux",
  description:
    "Parcourez toute la collection Nyra Jewellery : bagues, colliers, bracelets et ensembles en acier inoxydable moderne. Filtrez par catégorie, prix et matière.",
}

export default function ShopPage() {
  return (
    <div>
      <PageHeader
        eyebrow="La Collection"
        title="Tous les bijoux"
        description="Découvrez notre sélection de bijoux modernes en acier inoxydable. Filtrez par catégorie, matière et prix pour trouver la pièce parfaite."
      />
      <Suspense fallback={null}>
        <ShopBrowser />
      </Suspense>
    </div>
  )
}
