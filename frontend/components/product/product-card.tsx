'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Eye } from 'lucide-react'
import { CATEGORY_LABELS } from '@/lib/data'
import { formatDA } from '@/lib/format'
import type { Product } from '@/lib/types'
import { ProductBadges } from './product-badges'

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative aspect-square overflow-hidden bg-secondary">
        <Image
          src={product.images[0] || '/placeholder.svg'}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <ProductBadges product={product} className="absolute left-3 top-3" />
        {product.availability === 'out-of-stock' ? (
          <div className="absolute inset-0 flex items-center justify-center bg-card/60 backdrop-blur-[1px]">
            <span className="rounded-full bg-foreground/80 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-primary-foreground">
              Épuisé
            </span>
          </div>
        ) : null}
        <span className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center gap-2 bg-primary/90 py-2.5 text-sm font-medium text-primary-foreground transition-transform duration-300 group-hover:translate-y-0">
          <Eye className="size-4" /> Voir les détails
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <span className="text-[0.7rem] uppercase tracking-widest text-muted-foreground">
          {CATEGORY_LABELS[product.category]}
        </span>
        <h3 className="line-clamp-1 font-serif text-lg font-medium text-foreground">
          {product.name}
        </h3>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-semibold text-primary">
            {formatDA(product.price)}
          </span>
          {product.oldPrice ? (
            <span className="text-sm text-muted-foreground line-through">
              {formatDA(product.oldPrice)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  )
}
