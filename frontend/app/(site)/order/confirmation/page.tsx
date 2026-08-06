import type { Metadata } from "next"
import { Suspense } from "react"
import { OrderConfirmation } from "@/components/order/order-confirmation"

export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "Your Nyra Jewellery order has been received.",
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-muted-foreground">Loading…</div>}>
      <OrderConfirmation />
    </Suspense>
  )
}
