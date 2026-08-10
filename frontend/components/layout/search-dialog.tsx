'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '@/components/store/store-provider'
import { CATEGORY_LABELS } from '@/lib/data'
import { formatDA } from '@/lib/format'

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase('fr-FR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function normalizeArabic(value: string) {
  return value
    .trim()
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ـ/g, '')
}

export function SearchDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { products } = useStore()

  const [query, setQuery] = useState('')

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')

      const t = setTimeout(() => {
        inputRef.current?.focus()
      }, 60)

      return () => clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (open) {
      window.addEventListener('keydown', onKey)
    }

    return () => {
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  const results = useMemo(() => {
    const rawQuery = query.trim()

    if (!rawQuery) {
      return []
    }

    const normalizedQuery = normalizeText(rawQuery)
    const normalizedArabicQuery = normalizeArabic(rawQuery)

    return products
      .filter((p) => {
        /*
         * -----------------------------------------
         * PRODUCT NAME
         * -----------------------------------------
         */
        const productName = normalizeText(p.name)

        /*
         * -----------------------------------------
         * DESCRIPTION
         * -----------------------------------------
         */
        const description = normalizeText(p.description || '')

        /*
         * -----------------------------------------
         * COLLECTION
         * -----------------------------------------
         */
        const collection = normalizeText(p.collection || '')

        /*
         * -----------------------------------------
         * CATEGORY
         * -----------------------------------------
         */
        const categoryLabel = normalizeText(
          CATEGORY_LABELS[p.category] ?? p.category ?? '',
        )

        /*
         * -----------------------------------------
         * ARABIC CATEGORY
         * -----------------------------------------
         *
         * Exemple:
         *
         * category = bracelets
         * Arabic = اساور
         *
         * Si l'utilisateur écrit:
         * س
         *
         * اساور.includes(س)
         *
         * => true
         */
        const categoryArabic = getArabicCategory(p.category)

        /*
         * -----------------------------------------
         * SEARCH
         * -----------------------------------------
         */
        return (
          productName.includes(normalizedQuery) ||
          description.includes(normalizedQuery) ||
          collection.includes(normalizedQuery) ||
          categoryLabel.includes(normalizedQuery) ||
          categoryArabic.includes(normalizedArabicQuery)
        )
      })
      .slice(0, 6)
  }, [products, query])

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto mt-20 w-full max-w-2xl rounded-3xl bg-background shadow-xl">
        <div className="flex items-center gap-3 border-b px-5 py-4">
          <Search className="size-5 text-muted-foreground" />

          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher bagues, bracelets, rings, اساور…"
            className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
            dir="auto"
          />

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 transition-colors hover:bg-secondary"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-2">
          {query.trim() && results.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Aucune pièce trouvée pour « {query} ».
            </p>
          ) : null}

          {!query.trim() ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Commencez à taper pour explorer la collection.
            </p>
          ) : null}

          <ul>
            {results.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/product/${p.slug}`}
                  onClick={onClose}
                  className="flex items-center gap-4 rounded-2xl px-3 py-2.5 transition-colors hover:bg-secondary"
                >
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-secondary">
                    <Image
                      src={p.images[0] || '/placeholder.svg'}
                      alt={p.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-foreground">
                      {p.name}
                    </span>

                    <span className="block text-xs text-muted-foreground">
                      {CATEGORY_LABELS[p.category] ?? p.category}
                    </span>
                  </span>

                  <span className="font-medium text-primary">
                    {formatDA(p.price)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}


/*
 * =========================================================
 * CATÉGORIES ARABES
 * =========================================================
 *
 * Mets ici les traductions de tes catégories.
 */

function getArabicCategory(category: string | undefined) {
  const categories: Record<string, string> = {
    bracelets: 'اساور',
    bracelet: 'اساور',

    rings: 'خواتم',
    ring: 'خاتم',

    necklaces: 'قلائد',
    necklace: 'قلادة',

    earrings: 'اقراط',
    earring: 'قرط',

    sets: 'اطقم',
    set: 'طقم',
  }

  return normalizeArabic(
    categories[category?.toLowerCase() ?? ''] ?? '',
  )
}