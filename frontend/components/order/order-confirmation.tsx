"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Check, MessageCircle } from "lucide-react"
import { BRAND } from "@/lib/data"
import { formatDZD } from "@/lib/format"
import type { Order } from "@/lib/types"

export function OrderConfirmation() {
  const params = useSearchParams()
  const number = params.get("number")
  const [order, setOrder] = useState<Order | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem("nyra_last_order")
      if (raw) {
        const parsed: Order = JSON.parse(raw)
        if (!number || parsed.orderNumber === number) setOrder(parsed)
      }
    } catch {
      // ignore
    } finally {
      setChecked(true)
    }
  }, [number])

  const waMessage = useMemo(() => {
    if (!order) return ""
    const lines = order.items.map((i) => `• ${i.name} x${i.quantity}`).join("\n")
    return encodeURIComponent(
      `Hello Nyra Jewellery! I placed order ${order.orderNumber}.\n${lines}\nTotal: ${formatDZD(order.total)}\nName: ${order.fullName}\nWilaya: ${order.wilaya}, ${order.commune}`,
    )
  }, [order])

  if (!checked) return <div className="py-24 text-center text-muted-foreground">Loading…</div>

  if (!order) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-serif text-2xl">Order not found</h1>
        <p className="mt-2 text-muted-foreground">
          We couldn&apos;t find that order&apos;s receipt on this device. Don&apos;t worry — if it was placed, it has
          been received.
        </p>
        <Link href="/shop" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">
          Back to shop
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 md:px-6">
      <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-8" />
        </div>
        <h1 className="mt-6 font-serif text-3xl">Thank you, {order.fullName.split(" ")[0]}!</h1>
        <p className="mt-2 text-muted-foreground text-pretty">
          Your order has been received. We&apos;ll call or message you shortly to confirm delivery.
        </p>
        <p className="mt-4 inline-block rounded-full bg-secondary px-4 py-1.5 text-sm font-medium">
          Order {order.orderNumber}
        </p>
      </div>

      <div className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h2 className="font-serif text-lg">Order details</h2>
        <ul className="mt-4 divide-y divide-border">
          {order.items.map((i) => (
            <li key={`${i.productId}-${i.size ?? "na"}`} className="flex items-center justify-between py-3 text-sm">
              <span>
                {i.name} <span className="text-muted-foreground">x{i.quantity}</span>
                {i.size && <span className="text-muted-foreground"> · Size {i.size}</span>}
              </span>
              <span className="font-medium">{formatDZD(i.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatDZD(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Delivery</span>
            <span>{formatDZD(order.deliveryFee)}</span>
          </div>
          <div className="flex justify-between pt-1 text-base font-semibold">
            <span>Total (cash on delivery)</span>
            <span className="text-primary">{formatDZD(order.total)}</span>
          </div>
        </div>

        <div className="mt-5 grid gap-1 rounded-2xl bg-secondary/60 p-4 text-sm">
          <p><span className="text-muted-foreground">Deliver to:</span> {order.fullName}</p>
          <p><span className="text-muted-foreground">Phone:</span> {order.phone}</p>
          <p><span className="text-muted-foreground">Address:</span> {order.address}, {order.commune}, {order.wilaya}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <a
          href={`https://wa.me/${BRAND.whatsapp}?text=${waMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <MessageCircle className="size-4" /> Confirm on WhatsApp
        </a>
        <Link
          href="/shop"
          className="inline-flex flex-1 items-center justify-center rounded-full border border-primary px-6 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  )
}
