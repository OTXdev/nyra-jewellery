'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { fetchCategories, type ApiCategory } from '@/lib/api'

/** Display order and label overrides (the API name may differ from display preference). */
const CATEGORY_ORDER = ['rings', 'necklaces', 'bracelets', 'earrings', 'sets']
const CATEGORY_DISPLAY: Record<string, { label: string; href: string }> = {
  rings: { label: 'Bagues', href: '/shop?category=rings' },
  necklaces: { label: 'Colliers', href: '/shop?category=necklaces' },
  bracelets: { label: 'Bracelets', href: '/shop?category=bracelets' },
  earrings: { label: 'Boucles', href: '/shop?category=earrings' },
  sets: { label: 'Ensembles', href: '/shop?category=sets' },
}

export function Categories() {
  const [categories, setCategories] = useState<ApiCategory[]>([])

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => {
        // On error keep empty — no categories are shown.
      })
  }, [])

  // Build the display list from the categories returned by the backend.
  // Only categories with an uploaded admin image are shown — no fallbacks.
  const items = CATEGORY_ORDER.flatMap((slug) => {
    const cat = categories.find((c) => c.slug === slug)
    if (!cat || !cat.image) return []
    const display = CATEGORY_DISPLAY[slug] ?? { label: slug, href: `/shop?category=${slug}` }
    return [
      {
        slug,
        label: display.label,
        href: display.href,
        image: cat.image,
      },
    ]
  })

  return (
    <div className="flex w-full items-stretch gap-3 sm:gap-4 lg:gap-6">
      {items.map((c) => (
        <Link
          key={c.slug}
          href={c.href}
          className="group relative aspect-[3/4] min-w-0 flex-1 overflow-hidden rounded-3xl border border-border shadow-sm"
        >
          <Image
            src={c.image}
            alt={c.label}
            fill
            sizes="(max-width: 640px) 20vw, (max-width: 1024px) 20vw, 20vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-primary/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 lg:p-5">
            <p className="font-serif text-sm font-medium leading-tight text-primary-foreground sm:text-lg lg:text-xl">
              {c.label}
            </p>
            <p className="mt-0.5 hidden text-xs text-primary-foreground/80 opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:block sm:text-sm">
              Acheter →
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}
