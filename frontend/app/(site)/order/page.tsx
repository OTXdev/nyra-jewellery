import type { Metadata } from "next"
import { OrderForm } from "@/components/order/order-form"
export const dynamic = "force-dynamic"
export const metadata: Metadata = {
  title: "Passer votre commande",
  description: "Finalisez votre commande Nyra Jewellery avec paiement à la livraison partout en Algérie.",
}

export default function OrderPage() {
  return <OrderForm />
}
