'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '@/components/store/store-provider'
import { CATEGORY_LABELS } from '@/lib/data'
import { formatDA } from '@/lib/format'

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
      const t = setTimeout(() => inputRef.current?.focus(), 60)
      return () => clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.collection ?? '').toLowerCase().includes(q) ||
          CATEGORY_LABELS[p.category].toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      )
      .slice(0, 6)
  }, [products, query])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-24 sm:pt-28">
      <button
        aria-label="Fermer la recherche"
        className="absolute inset-0 bg-primary/30 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl animate-fade-up">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <Search className="size-5 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher bagues, colliers, collections…"
            className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
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
                      {CATEGORY_LABELS[p.category]}
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
