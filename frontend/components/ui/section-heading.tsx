import { cn } from '@/lib/utils'

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  align?: 'center' | 'left'
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3',
        align === 'center' ? 'items-center text-center' : 'items-start',
        className,
      )}
    >
      {eyebrow ? (
        <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.3em] text-accent-foreground/70">
          <span className="h-px w-6 bg-accent" />
          {eyebrow}
        </span>
      ) : null}
      <h2 className="max-w-2xl text-balance font-serif text-3xl font-semibold text-primary sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            'max-w-xl text-pretty leading-relaxed text-muted-foreground',
            align === 'center' ? 'mx-auto' : '',
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  )
}
