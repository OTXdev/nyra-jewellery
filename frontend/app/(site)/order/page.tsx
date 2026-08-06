import type { Metadata } from "next"
import { OrderForm } from "@/components/order/order-form"

export const metadata: Metadata = {
  title: "Place Your Order",
  description: "Complete your Nyra Jewellery order with cash on delivery across Algeria.",
}

export default function OrderPage() {
  return <OrderForm />
}
