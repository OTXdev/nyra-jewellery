'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { fetchCategories, type ApiCategory } from '@/lib/api'

/** Fallback images used when the backend has no image set for a category. */
const FALLBACK_IMAGES: Record<string, string> = {
  rings: '/images/ring-emerald.png',
  necklaces: '/images/necklace-pendant.png',
  bracelets: '/images/bracelet-tennis.png',
  sets: '/images/set-bridal.png',
}

/** Display order and label overrides (the API name may differ from display preference). */
const CATEGORY_ORDER = ['rings', 'necklaces', 'bracelets', 'sets']
const CATEGORY_DISPLAY: Record<string, { label: string; href: string }> = {
  rings: { label: 'Rings', href: '/shop?category=rings' },
  necklaces: { label: 'Necklaces', href: '/shop?category=necklaces' },
  bracelets: { label: 'Bracelets', href: '/shop?category=bracelets' },
  sets: { label: 'Jewelry Sets', href: '/shop?category=sets' },
}

export function Categories() {
  const [categories, setCategories] = useState<ApiCategory[]>([])

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => {
        // On error keep empty — fallback images will still render via FALLBACK_IMAGES.
      })
  }, [])

  // Build the display list: use API categories when available, fall back to
  // the static list so the section always renders (even before data loads).
  const items =
    categories.length > 0
      ? CATEGORY_ORDER.map((slug) => {
          const cat = categories.find((c) => c.slug === slug)
          const display = CATEGORY_DISPLAY[slug] ?? { label: slug, href: `/shop?category=${slug}` }
          return {
            slug,
            label: display.label,
            href: display.href,
            image: cat?.image || FALLBACK_IMAGES[slug] || '/placeholder.svg',
          }
        })
      : CATEGORY_ORDER.map((slug) => ({
          slug,
          label: CATEGORY_DISPLAY[slug]?.label ?? slug,
          href: CATEGORY_DISPLAY[slug]?.href ?? `/shop?category=${slug}`,
          image: FALLBACK_IMAGES[slug] || '/placeholder.svg',
        }))

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
      {items.map((c) => (
        <Link
          key={c.slug}
          href={c.href}
          className="group relative aspect-[3/4] overflow-hidden rounded-3xl border border-border shadow-sm"
        >
          <Image
            src={c.image}
            alt={c.label}
            fill
            sizes="(max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-primary/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5">
            <p className="font-serif text-xl font-medium text-primary-foreground">
              {c.label}
            </p>
            <p className="mt-0.5 text-sm text-primary-foreground/80 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              Shop now →
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}
