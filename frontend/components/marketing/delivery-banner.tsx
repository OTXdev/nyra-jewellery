import { Gift, Truck } from 'lucide-react'
import { formatDA } from '@/lib/format'
import { cn } from '@/lib/utils'

export function DeliveryOffers({ className }: { className?: string }) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2', className)}>
      <div className="flex items-center gap-4 rounded-2xl border border-accent/50 bg-accent/15 p-5">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Truck className="size-6" />
        </span>
        <div>
          <p className="font-medium text-foreground">Free Delivery</p>
          <p className="text-sm text-muted-foreground">
            On every order of {formatDA(7000)} or more.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 rounded-2xl border border-wine/40 bg-wine/10 p-5">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-wine text-wine-foreground">
          <Gift className="size-6" />
        </span>
        <div>
          <p className="font-medium text-foreground">Free Mini Gift</p>
          <p className="text-sm text-muted-foreground">
            Plus free delivery on orders of {formatDA(10000)}+.
          </p>
        </div>
      </div>
    </div>
  )
}

/** Compact progress bar showing how close the cart is to the next offer. */
export function DeliveryProgress({
  subtotal,
  remaining,
  nextLabel,
  freeDelivery,
  freeGift,
}: {
  subtotal: number
  remaining: number
  nextLabel: string | null
  freeDelivery: boolean
  freeGift: boolean
}) {
  const target = freeDelivery ? 10000 : 7000
  const pct = Math.min(100, Math.round((subtotal / target) * 100))
  return (
    <div className="rounded-2xl border border-border bg-secondary/60 p-4">
      {freeGift ? (
        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Gift className="size-4 text-wine" />
          You&apos;ve unlocked free delivery and a free mini gift.
        </p>
      ) : freeDelivery ? (
        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Truck className="size-4 text-primary" />
          Free delivery unlocked. Add {formatDA(remaining)} more for a free
          gift.
        </p>
      ) : (
        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Truck className="size-4 text-muted-foreground" />
          Add {formatDA(remaining)} more to unlock {nextLabel}.
        </p>
      )}
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
