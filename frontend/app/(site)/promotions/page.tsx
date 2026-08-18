import type { Metadata } from "next"
import { PageHeader } from "@/components/layout/page-header"
import { PromotionsBrowser } from "@/components/shop/promotions-browser"
import { DeliveryOffers } from "@/components/marketing/delivery-banner"
export const dynamic = "force-dynamic"
export const metadata: Metadata = {
  title: "Promotions & Offres",
  description: "Découvrez les offres à durée limitée et les prix réduits sur certaines pièces Nyra Jewellery.",
}

export default function PromotionsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Durée limitée"
        title="Promotions & Offres"
        description="Des pièces sélectionnées à des prix exceptionnels. Ces offres ne dureront pas longtemps."
      />
      <div className="mx-auto max-w-6xl px-4 pb-8 md:px-6">
        <DeliveryOffers />
      </div>
      <PromotionsBrowser />
    </div>
  )
}
