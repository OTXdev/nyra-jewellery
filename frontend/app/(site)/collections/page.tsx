import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { mapApiCollection } from "@/lib/api"

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api").replace(/\/$/, "")

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Collections",
  description: "Explore Nyra Jewellery's curated collections.",
}

async function getCollections() {
  try {
    const res = await fetch(`${API_BASE}/collections/`, { cache: "no-store" })
    if (!res.ok) return []
    const data = await res.json()
    const list = Array.isArray(data) ? data : data.results
    return (list || []).map(mapApiCollection)
  } catch {
    return []
  }
}

export default async function CollectionsPage() {
  const collections = await getCollections()

  return (
    <div>
      <PageHeader
        eyebrow="Curated Edits"
        title="Our Collections"
        description="Each collection tells its own story — thoughtfully assembled to accompany your style."
      />
      <section className="mx-auto max-w-6xl px-4 pb-20 md:px-6">
        {collections.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">No collections available right now. Check back soon.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {collections.map((c: { id: number; name: string; slug: string; description: string; image: string | null }) => (
              <Link
                key={c.id}
                href={`/shop?collection=${encodeURIComponent(c.name)}`}
                className="group relative overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={c.image || "/placeholder.svg"}
                    alt={c.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/10 to-transparent" />
                </div>
                <div className="absolute inset-x-0 bottom-0 p-6 text-background">
                  <h2 className="font-serif text-2xl text-balance">{c.name}</h2>
                  <p className="mt-1 max-w-sm text-sm text-background/85 text-pretty">{c.description}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary-foreground">
                    <span className="rounded-full bg-primary px-4 py-1.5">Shop the edit</span>
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
