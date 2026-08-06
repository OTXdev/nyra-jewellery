import { discountPercent } from '@/lib/format'
import type { Product } from '@/lib/types'
import { cn } from '@/lib/utils'

export function ProductBadges({
  product,
  className,
}: {
  product: Product
  className?: string
}) {
  const discount = discountPercent(product.price, product.oldPrice)
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {product.isNew ? (
        <span className="rounded-full bg-primary px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-primary-foreground">
          New
        </span>
      ) : null}
      {product.isBestSeller ? (
        <span className="rounded-full bg-accent px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-accent-foreground">
          Best Seller
        </span>
      ) : null}
      {discount ? (
        <span className="rounded-full bg-wine px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-wine-foreground">
          -{discount}%
        </span>
      ) : null}
    </div>
  )
}
