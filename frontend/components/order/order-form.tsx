"use client"

import type React from "react"
import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Gift, ShoppingBag, Truck } from "lucide-react"
import { useStore } from "@/components/store/store-provider"
import { useWilayas } from "@/lib/wilayas"
import { createOrder, ApiError } from "@/lib/api"
import { formatDZD } from "@/lib/format"
import { validatePhone } from "@/lib/phone"

export function OrderForm() {
  const router = useRouter()
  const { cart, products, subtotal, delivery, clearCart, hydrated } = useStore()
  const { wilayas, loading: wilayasLoading } = useWilayas()

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    wilayaId: "",
    commune: "",
    address: "",
    notes: "",
  })
  const [deliveryMethod, setDeliveryMethod] = useState<"home" | "stopdesk">("home")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const selectedWilaya = useMemo(
    () => wilayas.find((w) => String(w.id) === form.wilayaId),
    [wilayas, form.wilayaId],
  )

  const rawDeliveryFee = selectedWilaya?.deliveryFee ?? 0
  const rawStopdeskFee = selectedWilaya?.stopdeskFee ?? selectedWilaya?.deliveryFee ?? 0
  const chosenRawFee = deliveryMethod === "home" ? rawDeliveryFee : rawStopdeskFee
  const deliveryFee = delivery.freeDelivery ? 0 : chosenRawFee
  const estimatedTotal = subtotal + deliveryFee

  if (!hydrated) return <div className="py-24 text-center text-muted-foreground">Chargement…</div>

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h2 className="font-serif text-2xl">Votre panier est vide</h2>
        <p className="mt-2 text-muted-foreground">Ajoutez quelques pièces avant de passer commande.</p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
        >
          Parcourir les bijoux
        </Link>
      </div>
    )
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.fullName.trim()) e.fullName = "Veuillez saisir votre nom complet."
    const phoneError = validatePhone(form.phone)
    if (phoneError) e.phone = phoneError
    if (!form.wilayaId) e.wilaya = "Veuillez sélectionner votre wilaya."
    if (!form.commune.trim()) e.commune = "Veuillez saisir votre commune."
    // Address is required only for home delivery; for stopdesk pickup it's optional.
    if (deliveryMethod === "home" && !form.address.trim()) e.address = "Veuillez saisir votre adresse de livraison."
    setErrors(e)
    return Object.keys(e).length === 0
  }
   async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    setSubmitError(null)
    if (!validate()) return

    const idempotencyKey = crypto.randomUUID() 
    setSubmitting(true)
    try {
    const order = await createOrder({
        idempotency_key: idempotencyKey,
        customer_name: form.fullName.trim(),
        phone: form.phone.trim(),
        wilaya_id: Number(form.wilayaId),
        commune: form.commune.trim(),
        address: form.address.trim(),
        delivery_method: deliveryMethod,
        notes: form.notes.trim() || undefined,
        items: cart.map((i) => ({
          product_id: i.productId,
          quantity: i.quantity,
          size: i.size,
        })),
      })

      // Stash the confirmed order locally just so the confirmation page can
      // display the receipt — the order itself now lives on the backend.
      localStorage.setItem("nyra_last_order", JSON.stringify(order))
      clearCart()
      router.push(`/order/confirmation?number=${order.orderNumber}`)
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Impossible de passer votre commande. Veuillez réessayer.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <h1 className="font-serif text-3xl md:text-4xl">Finalisez votre commande</h1>
      <p className="mt-2 text-muted-foreground">Paiement à la livraison — nous confirmons votre commande par téléphone ou WhatsApp.</p>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom complet" error={errors.fullName}>
              <input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="input"
                placeholder="ex. Amina Bensalah"
              />
            </Field>
            <Field label="Numéro de téléphone" error={errors.phone}>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input"
                placeholder="0550 12 34 56"
                inputMode="tel"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mode de livraison">
              <div className="flex gap-3">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="delivery_method"
                    checked={deliveryMethod === "home"}
                    onChange={() => setDeliveryMethod("home")}
                    className="accent-primary"
                  />
                  <span>À domicile</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="delivery_method"
                    checked={deliveryMethod === "stopdesk"}
                    onChange={() => setDeliveryMethod("stopdesk")}
                    className="accent-primary"
                  />
                  <span>Au bureau (pickup)</span>
                </label>
              </div>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Wilaya" error={errors.wilaya}>
              <select
                value={form.wilayaId}
                onChange={(e) => setForm({ ...form, wilayaId: e.target.value })}
                className="input"
                disabled={wilayasLoading}
              >
                <option value="">{wilayasLoading ? "Chargement…" : "Sélectionner la wilaya"}</option>
                {wilayas.map((w) => {
                  const stopdesk = w.stopdeskFee ?? w.deliveryFee
                  const fee = delivery.freeDelivery ? 0 : deliveryMethod === "home" ? w.deliveryFee : stopdesk
                  const label = deliveryMethod === "home" ? `livraison ${formatDZD(fee)}` : `retrait ${formatDZD(fee)}`
                  return (
                    <option key={w.id} value={w.id}>
                      {w.name} — {label}
                    </option>
                  )
                })}
              </select>
            </Field>
            <Field label="Commune" error={errors.commune}>
              <input
                value={form.commune}
                onChange={(e) => setForm({ ...form, commune: e.target.value })}
                className="input"
                placeholder="Votre commune"
              />
            </Field>
          </div>

          {deliveryMethod === "home" && (
            <Field label="Adresse de livraison" error={errors.address}>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="input"
                placeholder="Rue, immeuble, appartement…"
              />
            </Field>
          )}

          <Field label="Notes de commande (facultatif)">
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input resize-none"
              placeholder="Quelque chose à nous dire ?"
            />
          </Field>
        </div>

        {/* Summary */}
        <aside className="h-fit space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm lg:sticky lg:top-24">
          <h2 className="font-serif text-xl">Votre commande</h2>
          <ul className="space-y-3">
            {cart.map((i) => {
              const p = products.find((pr) => pr.id === i.productId)
              if (!p) return null
              return (
                <li key={`${i.productId}-${i.size ?? "na"}`} className="flex items-center gap-3">
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-secondary">
                    <Image
                      src={p.images[0] || "/placeholder.svg"}
                      alt={p.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">Qté {i.quantity}</p>
                  </div>
                  <span className="text-sm font-medium">{formatDZD(p.price * i.quantity)}</span>
                </li>
              )
            })}
          </ul>

          <div className="space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sous-total</span>
              <span className="font-medium">{formatDZD(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{deliveryMethod === "home" ? "Livraison (À domicile)" : "Retrait (Au bureau)"}</span>
              <span className="font-medium">
                {delivery.freeDelivery ? (
                  <span className="text-primary">Gratuite</span>
                ) : selectedWilaya ? (
                  formatDZD(chosenRawFee)
                ) : (
                  "Sélectionnez une wilaya"
                )}
              </span>
            </div>
          </div>

          {(delivery.freeDelivery || delivery.freeGift) && (
            <div className="space-y-2 rounded-2xl bg-accent/10 p-3 text-sm">
              {delivery.freeDelivery && (
                <p className="flex items-center gap-2 text-foreground">
                  <Truck className="size-4 text-primary" /> Livraison gratuite débloquée
                </p>
              )}
              {delivery.freeGift && (
                <p className="flex items-center gap-2 text-foreground">
                  <Gift className="size-4 text-primary" /> Vous êtes éligible à un cadeau surprise !
                </p>
              )}
            </div>
          )}

          <div className="flex justify-between border-t border-border pt-4 text-base font-semibold">
            <span>Total</span>
            <span className="text-primary">{formatDZD(estimatedTotal)}</span>
          </div>

          {submitError && <p className="text-sm text-destructive">{submitError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            <ShoppingBag className="size-4" /> {submitting ? "Passage de la commande…" : "Passer la commande"}
          </button>
          <p className="text-center text-xs text-muted-foreground">
            Vous payez {formatDZD(estimatedTotal)} en espèces à la réception de votre commande.
          </p>
        </aside>
      </form>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  )
}
