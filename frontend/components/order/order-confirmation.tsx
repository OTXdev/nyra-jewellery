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
      `Bonjour Nyra Jewellery ! J'ai passé la commande ${order.orderNumber}.\n${lines}\nTotal : ${formatDZD(order.total)}\nNom : ${order.fullName}\nWilaya : ${order.wilaya}, ${order.commune}`,
    )
  }, [order])

  if (!checked) return <div className="py-24 text-center text-muted-foreground">Chargement…</div>

  if (!order) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-serif text-2xl">Commande introuvable</h1>
        <p className="mt-2 text-muted-foreground">
          Nous n&apos;avons pas trouvé le reçu de cette commande sur cet appareil. Pas d&apos;inquiétude — si elle a été
          passée, elle a bien été reçue.
        </p>
        <Link href="/shop" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">
          Retour à la boutique
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
        <h1 className="mt-6 font-serif text-3xl">Merci, {order.fullName.split(" ")[0]}!</h1>
        <p className="mt-2 text-muted-foreground text-pretty">
          Votre commande a été reçue. Nous vous appellerons ou vous enverrons un message très vite pour confirmer la
          livraison.
        </p>
        <p className="mt-4 inline-block rounded-full bg-secondary px-4 py-1.5 text-sm font-medium">
          Commande {order.orderNumber}
        </p>
      </div>

      <div className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h2 className="font-serif text-lg">Détails de la commande</h2>
        <ul className="mt-4 divide-y divide-border">
          {order.items.map((i) => (
            <li key={`${i.productId}-${i.size ?? "na"}`} className="flex items-center justify-between py-3 text-sm">
              <span>
                {i.name} <span className="text-muted-foreground">x{i.quantity}</span>
                {i.size && <span className="text-muted-foreground"> · Taille {i.size}</span>}
              </span>
              <span className="font-medium">{formatDZD(i.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sous-total</span>
            <span>{formatDZD(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Livraison</span>
            <span>{formatDZD(order.deliveryFee)}</span>
          </div>
          <div className="flex justify-between pt-1 text-base font-semibold">
            <span>Total (paiement à la livraison)</span>
            <span className="text-primary">{formatDZD(order.total)}</span>
          </div>
        </div>

        <div className="mt-5 grid gap-1 rounded-2xl bg-secondary/60 p-4 text-sm">
          <p><span className="text-muted-foreground">Livrer à :</span> {order.fullName}</p>
          <p><span className="text-muted-foreground">Téléphone :</span> {order.phone}</p>
          <p><span className="text-muted-foreground">Adresse :</span> {order.address}, {order.commune}, {order.wilaya}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <a
          href={`https://wa.me/${BRAND.whatsapp}?text=${waMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <MessageCircle className="size-4" /> Confirmer sur WhatsApp
        </a>
        <Link
          href="/shop"
          className="inline-flex flex-1 items-center justify-center rounded-full border border-primary px-6 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          Continuer vos achats
        </Link>
      </div>
    </div>
  )
}
