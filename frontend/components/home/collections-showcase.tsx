"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { useStore } from "@/components/store/store-provider"

export function CollectionsShowcase() {
  const { collections } = useStore()

  if (collections.length === 0) return null

  return (
    <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
      {collections.map((c, i) => (
<Link
          key={c.id}
          href={`/shop?collection=${encodeURIComponent(c.name)}`}
          className={`group relative overflow-hidden rounded-3xl border border-border shadow-sm ${
            i === 0 ? "lg:row-span-2 lg:aspect-auto" : ""
          } aspect-[16/10] lg:aspect-auto lg:min-h-[15rem]`}
        >
          <Image
            src={c.image || "/placeholder.svg"}
            alt={c.name}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/75 via-primary/25 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-6">
            <span className="mb-1 text-xs uppercase tracking-[0.3em] text-accent">
              Collection
            </span>
            <h3 className="font-serif text-2xl font-semibold text-primary-foreground">
              {c.name}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-primary-foreground/85">
              {c.description}
            </p>
            <span className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary-foreground/15 px-4 py-2 text-sm font-medium text-primary-foreground backdrop-blur transition-colors group-hover:bg-primary-foreground/25">
              Explorer <ArrowUpRight className="size-4" />
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}
