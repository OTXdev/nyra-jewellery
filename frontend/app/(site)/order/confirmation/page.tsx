import type { Metadata } from "next"
import { Suspense } from "react"
import { OrderConfirmation } from "@/components/order/order-confirmation"
export const dynamic = "force-dynamic"
export const metadata: Metadata = {
  title: "Commande confirmée",
  description: "Votre commande Nyra Jewellery a bien été reçue.",
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-muted-foreground">Chargement…</div>}>
      <OrderConfirmation />
    </Suspense>
  )
}
