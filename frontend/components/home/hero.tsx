import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 sm:pt-28">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-8 pt-8 sm:px-6 lg:grid-cols-2 lg:gap-6 lg:px-8 lg:pb-20 lg:pt-16">
        <div className="flex flex-col items-start gap-6 animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/60 bg-accent/15 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-accent-foreground">
            <Sparkles className="size-3.5" />
            Handcrafted in Algeria
          </span>
          <h1 className="text-balance font-serif text-4xl font-semibold leading-tight text-primary sm:text-5xl lg:text-6xl">
            Timeless jewelry, made to be remembered.
          </h1>
          <p className="max-w-md text-pretty text-lg leading-relaxed text-muted-foreground">
            Discover Nyra&apos;s curated collections of rings, necklaces,
            bracelets and sets. Browse, add to your cart, and request your
            order — we&apos;ll take care of the rest.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/shop"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground shadow-lg transition-all hover:shadow-xl"
            >
              Shop the Collection
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/promotions"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-7 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              View Promotions
            </Link>
          </div>
          <div className="mt-2 flex items-center gap-6 text-sm text-muted-foreground">
            <div>
              <p className="font-serif text-2xl font-semibold text-primary">
                500+
              </p>
              <p>Happy clients</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="font-serif text-2xl font-semibold text-primary">
                100%
              </p>
              <p>Handcrafted</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="font-serif text-2xl font-semibold text-primary">
                Free
              </p>
              <p>Delivery 7k+</p>
            </div>
          </div>
        </div>

        <div className="relative animate-fade-up [animation-delay:120ms]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] border border-border shadow-2xl sm:aspect-[4/4.5]">
            <Image
              src="/images/hero.png"
              alt="Model wearing Nyra Jewellery gold rings and emerald pendant"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-5 -left-4 hidden rounded-2xl border border-border bg-card/90 px-5 py-4 shadow-xl backdrop-blur sm:block">
            <p className="font-serif text-lg text-primary">Royal Emerald</p>
            <p className="text-xs text-muted-foreground">New collection</p>
          </div>
        </div>
      </div>
    </section>
  )
}
