'use client'

import { useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ProductGrid } from '@/components/product/product-grid'
import { useStore } from '@/components/store/store-provider'
import { CATEGORY_LABELS, RING_SIZES } from '@/lib/data'
import { formatDA } from '@/lib/format'
import type { Category } from '@/lib/types'
import { cn } from '@/lib/utils'

type SortKey = 'newest' | 'price-asc' | 'price-desc' | 'popularity'

const CATEGORIES: (Category | 'all')[] = [
  'all',
  'rings',
  'necklaces',
  'bracelets',
  'earrings',
  'sets',
]

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'Nouveautés' },
  { key: 'popularity', label: 'Les plus populaires' },
  { key: 'price-asc', label: 'Prix : croissant' },
  { key: 'price-desc', label: 'Prix : décroissant' },
]

function Toggle({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full border px-3.5 py-1.5 text-sm transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-foreground hover:border-primary/50',
      )}
    >
      {children}
    </button>
  )
}

export function ShopBrowser() {
  const { products, productsLoading, productsError } = useStore()
  const params = useSearchParams()

  const priceBounds = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 0 }
    const prices = products.map((p) => p.price)
    return { min: Math.min(...prices), max: Math.max(...prices) }
  }, [products])

const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category | 'all'>('all')
  const [maxPrice, setMaxPrice] = useState(priceBounds.max)
  const [promoOnly, setPromoOnly] = useState(false)
  const [newOnly, setNewOnly] = useState(false)
  const [bestOnly, setBestOnly] = useState(false)
  const [inStockOnly, setInStockOnly] = useState(false)
  const [ringSize, setRingSize] = useState<string | null>(null)
  const [collection, setCollection] = useState<string | null>(null)
  const [sort, setSort] = useState<SortKey>('newest')
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Apply URL params on mount / change
  useEffect(() => {
    const cat = params.get('category') as Category | null
    if (cat && CATEGORIES.includes(cat)) setCategory(cat)
    const filter = params.get('filter')
    if (filter === 'new') setNewOnly(true)
    if (filter === 'bestseller') setBestOnly(true)
    if (filter === 'promo') setPromoOnly(true)
    const col = params.get('collection')
    if (col) setCollection(col)
    const q = params.get('q')
    if (q) setQuery(q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  useEffect(() => {
    setMaxPrice(priceBounds.max)
  }, [priceBounds.max])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
const list = products.filter((p) => {
      if (collection !== null && p.collection !== collection) return false
      if (category !== 'all' && p.category !== category) return false
      if (maxPrice > 0 && p.price > maxPrice) return false
      if (promoOnly && !p.onPromotion) return false
      if (newOnly && !p.isNew) return false
      if (bestOnly && !p.isBestSeller) return false
      if (inStockOnly && p.availability !== 'in-stock') return false
      if (ringSize !== null && !(p.sizes ?? []).includes(ringSize)) return false
      if (
        q &&
        !(
          p.name.toLowerCase().includes(q) ||
          (p.collection ?? '').toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          CATEGORY_LABELS[p.category].toLowerCase().includes(q)
        )
      )
        return false
      return true
    })

    switch (sort) {
      case 'price-asc':
        list.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        list.sort((a, b) => b.price - a.price)
        break
      case 'popularity':
        list.sort((a, b) => b.popularity - a.popularity)
        break
      default:
        list.sort((a, b) => b.createdAt - a.createdAt)
    }
    return list
  }, [products, query, category, maxPrice, promoOnly, newOnly, bestOnly, inStockOnly, ringSize, collection, sort])

  const resetAll = () => {
    setQuery('')
    setCategory('all')
    setMaxPrice(priceBounds.max)
    setPromoOnly(false)
    setNewOnly(false)
    setBestOnly(false)
    setInStockOnly(false)
    setRingSize(null)
    setCollection(null)
    setSort('newest')
  }

  const showRingFilters = category === 'rings' || category === 'all'

  if (productsLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center text-muted-foreground sm:px-6 lg:px-8">
        Chargement de la collection…
      </div>
    )
  }

  if (productsError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <p className="text-destructive">{productsError}</p>
      </div>
    )
  }

  const filterPanel = (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground">
          Catégorie
        </h3>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Toggle
              key={c}
              active={category === c}
              onClick={() => setCategory(c)}
            >
              {c === 'all' ? 'Tout' : CATEGORY_LABELS[c]}
            </Toggle>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground">
          Prix maximum
        </h3>
        <input
          type="range"
          min={priceBounds.min}
          max={priceBounds.max}
          step={100}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>{formatDA(priceBounds.min)}</span>
          <span className="font-medium text-foreground">
            Jusqu à {formatDA(maxPrice)}
          </span>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground">
          Affiner
        </h3>
        <div className="flex flex-wrap gap-2">
          <Toggle active={newOnly} onClick={() => setNewOnly((v) => !v)}>
            Nouveautés
          </Toggle>
          <Toggle active={bestOnly} onClick={() => setBestOnly((v) => !v)}>
            Meilleures ventes
          </Toggle>
          <Toggle active={promoOnly} onClick={() => setPromoOnly((v) => !v)}>
            En promotion
          </Toggle>
          <Toggle active={inStockOnly} onClick={() => setInStockOnly((v) => !v)}>
            En stock
          </Toggle>
        </div>
      </div>

      {showRingFilters ? (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground">
            Taille de bague
          </h3>
          <div className="flex flex-wrap gap-2">
            {RING_SIZES.map((s) => (
              <Toggle
                key={s}
                active={ringSize === s}
                onClick={() => setRingSize(ringSize === s ? null : s)}
              >
                {s}
              </Toggle>
            ))}
          </div>
        </div>
      ) : null}

      <button
        onClick={resetAll}
        className="mt-2 self-start text-sm font-medium text-wine underline-offset-4 hover:underline"
      >
        Réinitialiser tous les filtres
      </button>
    </div>
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Search + sort bar */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-3 rounded-full border border-border bg-card px-4 py-2.5">
          <Search className="size-5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher dans la collection…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {query ? (
            <button onClick={() => setQuery('')} aria-label="Effacer la recherche">
              <X className="size-4 text-muted-foreground" />
            </button>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <label className="hidden text-sm text-muted-foreground sm:block">
            Trier
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-full border border-border bg-card px-4 py-2.5 text-sm outline-none"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setFiltersOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm lg:hidden"
          >
            <SlidersHorizontal className="size-4" /> Filtres
          </button>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 rounded-3xl border border-border bg-card p-6">
            {filterPanel}
          </div>
        </aside>

{/* Results */}
        <div className="flex-1">
          {collection ? (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border bg-card p-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Collection</p>
                <p className="font-serif text-xl text-primary">{collection}</p>
              </div>
              <button
                onClick={() => setCollection(null)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm hover:bg-secondary"
              >
                <X className="size-4" /> Effacer le filtre
              </button>
            </div>
          ) : null}
          <p className="mb-5 text-sm text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? 'pièce trouvée' : 'pièces trouvées'}
          </p>
          {filtered.length > 0 ? (
            <ProductGrid
              products={filtered}
              className="lg:grid-cols-2 xl:grid-cols-3"
            />
          ) : (
            <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center">
              <p className="font-serif text-xl text-primary">Aucune pièce trouvée</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Essayez d ajuster vos filtres ou votre recherche.
              </p>
              <button
                onClick={resetAll}
                className="mt-5 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      <div
        className={cn(
          'fixed inset-0 z-[55] lg:hidden',
          filtersOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
      >
        <div
          className={cn(
            'absolute inset-0 bg-primary/40 backdrop-blur-sm transition-opacity',
            filtersOpen ? 'opacity-100' : 'opacity-0',
          )}
          onClick={() => setFiltersOpen(false)}
        />
        <div
          className={cn(
            'absolute right-0 top-0 flex h-full w-80 max-w-[85%] flex-col overflow-y-auto bg-card p-6 shadow-2xl transition-transform duration-300',
            filtersOpen ? 'translate-x-0' : 'translate-x-full',
          )}
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-serif text-xl text-primary">Filtres</h2>
            <button
              onClick={() => setFiltersOpen(false)}
              aria-label="Fermer les filtres"
              className="rounded-full p-1.5 hover:bg-secondary"
            >
              <X className="size-6" />
            </button>
          </div>
          {filterPanel}
          <button
            onClick={() => setFiltersOpen(false)}
            className="mt-8 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground"
          >
            Afficher {filtered.length} résultats
          </button>
        </div>
      </div>
    </div>
  )
}
