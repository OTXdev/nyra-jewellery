import type { Metadata } from "next"
import { CartView } from "@/components/cart/cart-view"
export const dynamic = "force-dynamic"
export const metadata: Metadata = {
  title: "Votre panier",
  description: "Consultez les pièces de votre panier avant de passer votre commande chez Nyra Jewellery.",
}

export default function CartPage() {
  return <CartView />
}
