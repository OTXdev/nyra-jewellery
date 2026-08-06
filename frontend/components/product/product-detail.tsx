"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, ChevronDown, Heart, Minus, Plus, ShoppingBag, Truck } from "lucide-react"
import { useStore } from "@/components/store/store-provider"
import { ProductBadges } from "@/components/product/product-badges"
import { ProductGrid } from "@/components/product/product-grid"
import { SectionHeading } from "@/components/ui/section-heading"
import { CATEGORY_LABELS } from "@/lib/data"
import { fetchProduct } from "@/lib/api"
import { formatDZD } from "@/lib/format"
import type { CartItem, Product } from "@/lib/types"
import { cn } from "@/lib/utils"

export function ProductDetail({ slug }: { slug: string }) {
  const router = useRouter()
  const { addToCart, collections } = useStore()
  const [product, setProduct] = useState<Product | null | undefined>(undefined)
  const [activeImage, setActiveImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [size, setSize] = useState<string | undefined>(undefined)
  const [added, setAdded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const namesBySlug: Record<string, string> = {}
    collections.forEach((c) => (namesBySlug[c.slug] = c.name))
    fetchProduct(slug, namesBySlug)
      .then((p) => {
        if (!cancelled) setProduct(p)
      })
      .catch(() => {
        if (!cancelled) setProduct(null)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  if (product === undefined) {
    return <div className="mx-auto max-w-6xl px-4 py-24 text-center text-muted-foreground md:px-6">Loading…</div>
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center md:px-6">
        <h1 className="font-serif text-3xl">Product not found</h1>
        <p className="mt-3 text-muted-foreground">The piece you are looking for is no longer available.</p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
        >
          Back to shop
        </Link>
      </div>
    )
  }

  const outOfStock = product.availability === "out-of-stock"
  const needsSize = product.category === "rings" && (product.sizes?.length ?? 0) > 0
  const images = product.images.length ? product.images : ["/placeholder.svg"]
  const related = product.relatedProducts ?? []

  function handleAdd() {
    if (!product) return
    if (needsSize && size === undefined) {
      setError("Please select a ring size.")
      return
    }
    setError(null)
    const item: CartItem = {
      productId: product.id,
      quantity,
      size,
    }
    addToCart(item)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-foreground">
          Shop
        </Link>
        <span>/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Gallery */}
        <div className="flex flex-col gap-4">
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-border bg-secondary">
            <Image
              src={images[activeImage] || "/placeholder.svg"}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute left-4 top-4">
              <ProductBadges product={product} />
            </div>
          </div>
          {images.length > 1 && (
            <div className="flex gap-3">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  aria-label={`View image ${i + 1}`}
                  className={cn(
                    "relative aspect-square w-20 overflow-hidden rounded-2xl border-2 transition-colors",
                    activeImage === i ? "border-primary" : "border-border",
                  )}
                >
                  <Image src={img || "/placeholder.svg"} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.collection && (
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{product.collection}</p>
          )}
          <h1 className="mt-2 font-serif text-3xl text-balance md:text-4xl">{product.name}</h1>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl font-semibold text-primary">{formatDZD(product.price)}</span>
            {product.oldPrice && (
              <span className="text-lg text-muted-foreground line-through">{formatDZD(product.oldPrice)}</span>
            )}
          </div>

          <p className="mt-5 leading-relaxed text-muted-foreground text-pretty">{product.description}</p>

          {/* Ring size */}
          {needsSize ? (
            <div className="mt-6">
              <span className="mb-2 block text-sm font-medium">Ring size</span>
              <div className="flex flex-wrap gap-2">
                {product.sizes!.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setSize(s)
                      setError(null)
                    }}
                    className={cn(
                      "flex size-11 items-center justify-center rounded-full border text-sm transition-colors",
                      size === s
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Quantity + Add */}
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className="flex items-center rounded-full border border-border">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="flex size-11 items-center justify-center rounded-l-full transition-colors hover:bg-secondary"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-10 text-center text-sm font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Increase quantity"
                className="flex size-11 items-center justify-center rounded-r-full transition-colors hover:bg-secondary"
              >
                <Plus className="size-4" />
              </button>
            </div>

            <button
              onClick={handleAdd}
              disabled={outOfStock}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-opacity",
                outOfStock
                  ? "cursor-not-allowed bg-muted text-muted-foreground"
                  : "bg-primary text-primary-foreground hover:opacity-90",
              )}
            >
              {outOfStock ? (
                "Out of stock"
              ) : added ? (
                <>
                  <Check className="size-4" /> Added to cart
                </>
              ) : (
                <>
                  <ShoppingBag className="size-4" /> Add to cart
                </>
              )}
            </button>
          </div>

          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

          <button
            onClick={() => {
              handleAdd()
              if (!(needsSize && size === undefined)) router.push("/cart")
            }}
            disabled={outOfStock}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-primary px-6 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:border-muted disabled:text-muted-foreground disabled:hover:bg-transparent"
          >
            <Heart className="size-4" /> Buy it now
          </button>

          {/* Delivery note */}
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-4">
            <Truck className="mt-0.5 size-5 text-primary" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Cash on delivery across Algeria</p>
              <p className="text-muted-foreground">
                Free delivery on orders over {formatDZD(7000)}. A free gift over {formatDZD(10000)}.
              </p>
            </div>
          </div>

          {/* Details accordion */}
          <div className="mt-6 divide-y divide-border border-y border-border">
            <Detail label="Category">{CATEGORY_LABELS[product.category]}</Detail>
            {product.material && <Detail label="Material">{product.material}</Detail>}
            {product.color && <Detail label="Color">{product.color}</Detail>}
            {product.care && <Detail label="Care instructions">{product.care}</Detail>}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <SectionHeading eyebrow="You may also love" title="Complete the look" align="center" />
          <div className="mt-8">
            <ProductGrid products={related} />
          </div>
        </section>
      )}
    </div>
  )
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-3.5 text-left text-sm font-medium"
      >
        {label}
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && <p className="pb-4 text-sm leading-relaxed text-muted-foreground">{children}</p>}
    </div>
  )
}
