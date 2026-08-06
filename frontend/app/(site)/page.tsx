'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useMemo } from 'react'
import { Categories } from '@/components/home/categories'
import { CollectionsShowcase } from '@/components/home/collections-showcase'
import { Hero } from '@/components/home/hero'
import { DeliveryOffers } from '@/components/marketing/delivery-banner'
import { ProductGrid } from '@/components/product/product-grid'
import { useStore } from '@/components/store/store-provider'
import { SectionHeading } from '@/components/ui/section-heading'

function ViewAll({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-accent-foreground"
    >
      View all
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
    </Link>
  )
}

export default function HomePage() {
  const { products } = useStore()

  const newArrivals = useMemo(
    () =>
      [...products]
        .filter((p) => p.isNew)
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 4),
    [products],
  )
  const bestSellers = useMemo(
    () => products.filter((p) => p.isBestSeller).slice(0, 4),
    [products],
  )
  const promos = useMemo(
    () => products.filter((p) => p.oldPrice).slice(0, 4),
    [products],
  )
  const sets = useMemo(
    () => products.filter((p) => p.category === 'sets').slice(0, 4),
    [products],
  )

  return (
    <>
      <Hero />

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Shop by category"
          title="Find your perfect piece"
          description="From everyday elegance to special occasions, explore our four signature categories."
          className="mb-10"
        />
        <Categories />
      </section>

      {/* New arrivals */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <SectionHeading
            align="left"
            eyebrow="Just in"
            title="New arrivals"
          />
          <ViewAll href="/shop?filter=new" />
        </div>
        <ProductGrid products={newArrivals} />
      </section>

      {/* Delivery offers */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
          <SectionHeading
            eyebrow="Our promise"
            title="Delivery offers, on us"
            description="The more you add to your cart, the more you save."
            className="mb-8"
          />
          <DeliveryOffers />
        </div>
      </section>

      {/* Featured collections */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Curated"
          title="Featured collections"
          description="Each collection tells its own story, thoughtfully assembled to complement your style."
          className="mb-10"
        />
        <CollectionsShowcase />
      </section>

      {/* Best sellers */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <SectionHeading
            align="left"
            eyebrow="Loved by many"
            title="Best sellers"
          />
          <ViewAll href="/shop?filter=bestseller" />
        </div>
        <ProductGrid products={bestSellers} />
      </section>

      {/* Promotions */}
      {promos.length > 0 ? (
        <section className="bg-wine/5 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-end justify-between gap-4">
              <SectionHeading
                align="left"
                eyebrow="Limited time"
                title="Current promotions"
              />
              <ViewAll href="/promotions" />
            </div>
            <ProductGrid products={promos} />
          </div>
        </section>
      ) : null}

      {/* Jewelry sets */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <SectionHeading
            align="left"
            eyebrow="Complete the look"
            title="Jewelry sets"
          />
          <ViewAll href="/shop?category=sets" />
        </div>
        <ProductGrid products={sets} />
      </section>
    </>
  )
}
