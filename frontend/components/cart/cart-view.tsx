"use client"

import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react"
import { useStore } from "@/components/store/store-provider"
import { DeliveryOffers } from "@/components/marketing/delivery-banner"
import { formatDZD } from "@/lib/format"

const MAX_QUANTITY = 20

export function CartView() {
  const { cart, products, updateQuantity, removeFromCart, subtotal, hydrated } = useStore()

  if (!hydrated) {
    return <div className="py-24 text-center text-muted-foreground">Chargement…</div>
  }

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <ShoppingBag className="size-7" />
        </div>
        <h2 className="mt-6 font-serif text-2xl">Votre panier est vide</h2>
        <p className="mt-2 text-muted-foreground">Découvrez notre collection de bijoux modernes en acier inoxydable.</p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Commencer vos achats
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <h1 className="font-serif text-3xl md:text-4xl">Votre panier</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          <DeliveryOffers />
          {cart.map((item) => {
            const product = products.find((p) => p.id === item.productId)
            if (!product) return null
            return (
              <div
                key={`${item.productId}-${item.size ?? "na"}`}
                className="flex gap-4 rounded-3xl border border-border bg-card p-4 shadow-sm"
              >
                <Link
                  href={`/product/${product.slug}`}
                  className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-secondary"
                >
                  <Image
                    src={product.images[0] || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex justify-between gap-2">
                    <div>
                      <Link href={`/product/${product.slug}`} className="font-medium hover:text-primary">
                        {product.name}
                      </Link>
                      {item.size && (
                        <p className="text-xs text-muted-foreground">
                          Taille : {item.size === "adjustable" ? "Ajustable" : item.size}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.productId, item.size)}
                      aria-label={`Retirer ${product.name}`}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center rounded-full border border-border">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1, item.size)}
                          aria-label="Diminuer la quantité"
                          className="flex size-9 items-center justify-center rounded-l-full transition-colors hover:bg-secondary"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-9 text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1, item.size)}
                          aria-label="Augmenter la quantité"
                          disabled={item.quantity >= MAX_QUANTITY}
                          className="flex size-9 items-center justify-center rounded-r-full transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      {item.quantity >= MAX_QUANTITY && (
                        <p className="text-xs text-muted-foreground">Quantité maximale : {MAX_QUANTITY}</p>
                      )}
                    </div>
                    <span className="font-medium text-primary">{formatDZD(product.price * item.quantity)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <aside className="h-fit rounded-3xl border border-border bg-card p-6 shadow-sm lg:sticky lg:top-24">
          <h2 className="font-serif text-xl">Récapitulatif de la commande</h2>
          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Sous-total</dt>
              <dd className="font-medium">{formatDZD(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Livraison</dt>
              <dd className="text-muted-foreground">Calculée à la commande</dd>
            </div>
          </dl>
          <div className="mt-4 flex justify-between border-t border-border pt-4 text-base font-semibold">
            <span>Total</span>
            <span className="text-primary">{formatDZD(subtotal)}</span>
          </div>
          <Link
            href="/order"
            className="mt-6 block rounded-full bg-primary px-6 py-3 text-center text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Passer la commande
          </Link>
          <p className="mt-3 text-center text-xs text-muted-foreground">Paiement à la livraison — sans paiement en ligne</p>
          <Link
            href="/shop"
            className="mt-3 block text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Continuer vos achats
          </Link>
        </aside>
      </div>
    </div>
  )
}
