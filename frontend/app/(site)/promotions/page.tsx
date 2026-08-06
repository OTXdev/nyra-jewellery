import type { Metadata } from "next"
import { PageHeader } from "@/components/layout/page-header"
import { PromotionsBrowser } from "@/components/shop/promotions-browser"
import { DeliveryOffers } from "@/components/marketing/delivery-banner"

export const metadata: Metadata = {
  title: "Promotions & Offers",
  description: "Shop limited-time offers and reduced prices on selected Nyra Jewellery pieces.",
}

export default function PromotionsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Limited Time"
        title="Promotions & Offers"
        description="Treasured pieces at exceptional prices. These offers won't last long."
      />
      <div className="mx-auto max-w-6xl px-4 pb-8 md:px-6">
        <DeliveryOffers />
      </div>
      <PromotionsBrowser />
    </div>
  )
}
