import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumb,
}: {
  eyebrow?: string
  title: string
  description?: string
  breadcrumb?: { label: string; href?: string }[]
}) {
  return (
    <div className="border-b border-border bg-secondary/40 pt-24 sm:pt-28">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {breadcrumb ? (
          <nav className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-primary">
              Accueil
            </Link>
            {breadcrumb.map((b) => (
              <span key={b.label} className="flex items-center gap-1.5">
                <ChevronRight className="size-3.5" />
                {b.href ? (
                  <Link
                    href={b.href}
                    className="transition-colors hover:text-primary"
                  >
                    {b.label}
                  </Link>
                ) : (
                  <span className="text-foreground">{b.label}</span>
                )}
              </span>
            ))}
          </nav>
        ) : null}
        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary/70">{eyebrow}</p>
        ) : null}
        <h1 className="text-balance font-serif text-3xl font-semibold text-primary sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  )
}
