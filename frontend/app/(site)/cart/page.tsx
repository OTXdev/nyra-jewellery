import type { Metadata } from "next"
import { CartView } from "@/components/cart/cart-view"

export const metadata: Metadata = {
  title: "Your Cart",
  description: "Review the pieces in your cart before placing your order with Nyra Jewellery.",
}

export default function CartPage() {
  return <CartView />
}
