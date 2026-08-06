import Link from 'next/link'
import { cn } from '@/lib/utils'

export function Logo({
  className,
  showTagline = false,
}: {
  className?: string
  showTagline?: boolean
}) {
  return (
    <Link
      href="/"
      className={cn('group inline-flex flex-col leading-none', className)}
      aria-label="Nyra Jewellery home"
    >
      <span className="font-serif text-2xl font-semibold tracking-wide text-primary sm:text-3xl">
        Nyra
      </span>
      <span className="mt-0.5 text-[0.6rem] font-light uppercase tracking-[0.35em] text-accent-foreground/70">
        Jewellery
      </span>
      {showTagline ? (
        <span className="mt-1 text-xs italic text-muted-foreground">
          Modern elegance
        </span>
      ) : null}
    </Link>
  )
}
