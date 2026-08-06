"use client"

import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react"
import { useStore } from "@/components/store/store-provider"
import { DeliveryOffers } from "@/components/marketing/delivery-banner"
import { formatDZD } from "@/lib/format"

export function CartView() {
  const { cart, products, updateQuantity, removeFromCart, subtotal, hydrated } = useStore()

  if (!hydrated) {
    return <div className="py-24 text-center text-muted-foreground">Loading…</div>
  }

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <ShoppingBag className="size-7" />
        </div>
        <h2 className="mt-6 font-serif text-2xl">Your cart is empty</h2>
        <p className="mt-2 text-muted-foreground">Discover our handcrafted pieces and find something to treasure.</p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Start shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <h1 className="font-serif text-3xl md:text-4xl">Your Cart</h1>
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
                          Size: {item.size === "adjustable" ? "Adjustable" : item.size}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.productId, item.size)}
                      aria-label={`Remove ${product.name}`}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center rounded-full border border-border">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1, item.size)}
                        aria-label="Decrease quantity"
                        className="flex size-9 items-center justify-center rounded-l-full transition-colors hover:bg-secondary"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-9 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1, item.size)}
                        aria-label="Increase quantity"
                        className="flex size-9 items-center justify-center rounded-r-full transition-colors hover:bg-secondary"
                      >
                        <Plus className="size-3.5" />
                      </button>
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
          <h2 className="font-serif text-xl">Order Summary</h2>
          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium">{formatDZD(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd className="text-muted-foreground">Calculated at order</dd>
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
            Proceed to order
          </Link>
          <p className="mt-3 text-center text-xs text-muted-foreground">Cash on delivery — no online payment</p>
          <Link
            href="/shop"
            className="mt-3 block text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  )
}
