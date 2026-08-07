"use client"

import Image from 'next/image'
import Link from 'next/link'
import { useEffect } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'
import { fetchSiteSettings } from '@/lib/api'
import { setSiteImages, useSiteImages } from '@/lib/site-images'

export function Hero() {
  const { hero } = useSiteImages()

  useEffect(() => {
    let active = true
    fetchSiteSettings()
      .then((settings) => {
        if (active && settings?.hero_image) {
          setSiteImages({ hero: settings.hero_image })
        }
      })
      .catch(() => {
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <section className="relative flex min-h-[100svh] w-full items-center overflow-hidden">
      {/* Background photograph */}
      <Image
        src={hero}
        alt="Nyra Jewellery gold rings, bracelet and earrings styled with a branded gift bag and burgundy silk"
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 z-0 object-cover"
      />


      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-wine/92 via-wine/55 to-wine/10 sm:from-wine/90 sm:via-wine/45 sm:to-transparent" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black/35 via-transparent to-black/10" />

      {/* Content */}
      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-10 px-4 pb-16 pt-32 sm:px-6 lg:grid-cols-2 lg:gap-6 lg:px-8 lg:pb-24 lg:pt-28">
        <div className="flex flex-col items-start gap-6 animate-fade-up">
          <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.35em] text-gold">
            <Sparkles className="size-3.5" />
            Nyra Jewellery
          </span>
          <h1 className="text-balance font-serif text-4xl font-semibold leading-tight text-ivory drop-shadow-sm sm:text-5xl lg:text-6xl">
            Elegance for every day.
          </h1>
          <p className="max-w-md text-pretty text-lg leading-relaxed text-ivory/85">
            Discover our curated collection of stainless steel jewelry,
            thoughtfully selected to elevate every outfit with timeless gold
            and silver finishes. Browse, add to your cart, and request your
            order — we&apos;ll take care of the rest.
          </p>
          <div className="flex flex-wrap items-center gap-8">
            <Link
              href="/shop"
              className="group inline-flex items-center gap-2 border-b border-gold/70 pb-1 text-sm font-medium uppercase tracking-[0.15em] text-gold transition-all hover:border-gold hover:text-ivory"
            >
              Shop the Collection
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/promotions"
              className="inline-flex items-center gap-2 border-b border-ivory/40 pb-1 text-sm font-medium uppercase tracking-[0.15em] text-ivory/90 transition-all hover:border-ivory hover:text-ivory"
            >
              View Promotions
            </Link>
          </div>
          <div className="mt-2 flex items-center gap-6 text-sm text-ivory/80">
            <div>
              <p className="font-serif text-2xl font-semibold text-ivory">
                500+
              </p>
              <p>Happy clients</p>
            </div>
            <div className="h-8 w-px bg-ivory/30" />
            <div>
              <p className="font-serif text-2xl font-semibold text-ivory">
                Stainless
              </p>
              <p>Steel</p>
            </div>
            <div className="h-8 w-px bg-ivory/30" />
            <div>
              <p className="font-serif text-2xl font-semibold text-ivory">
                Free
              </p>
              <p>Delivery 7k+</p>
            </div>
          </div>
        </div>

        {/* Right column intentionally left clear so the photography reads
            through the gradient; the floating detail card anchors it */}
      
      </div>

      <div className="absolute bottom-6 left-4 z-10 animate-fade-up rounded-2xl border border-ivory/30 bg-card/90 px-5 py-4 shadow-xl backdrop-blur [animation-delay:120ms] lg:hidden">
        <p className="font-serif text-lg text-primary">Royal Emerald</p>
        <p className="text-xs text-muted-foreground">New collection</p>
      </div>
    </section>
  )
}
