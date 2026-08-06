"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect } from "react"
import { Gem, HandHeart, ShieldCheck, Truck } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { SectionHeading } from "@/components/ui/section-heading"
import { fetchSiteSettings } from "@/lib/api"
import { ABOUT_FALLBACK, setSiteImages, useSiteImages } from "@/lib/site-images"

const VALUES = [
  { icon: Gem, title: "Curated Selection", text: "Every piece is carefully selected for its quality, design and refined finish." },
  { icon: HandHeart, title: "Elegance for Every Day", text: "Modern, timeless designs made to accompany your style for any occasion." },
  { icon: ShieldCheck, title: "Quality & Refinement", text: "Modern stainless steel jewelry with beautiful gold and silver finishes." },
  { icon: Truck, title: "Cash on Delivery", text: "Order with confidence and pay when your order arrives at your door." },
]

export default function AboutPage() {
  const { about } = useSiteImages()

  useEffect(() => {
    let active = true
    fetchSiteSettings()
      .then((settings) => {
        if (active && settings?.about_image) {
          setSiteImages({ about: settings.about_image })
        }
      })
      .catch(() => {
        // fall back to the bundled image if the API is unavailable
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <div>
      <PageHeader
        eyebrow="Our Story"
        title="A boutique with a passion for jewelry"
        description="At Nyra Jewellery, we believe every piece of jewelry is more than a simple accessory — it is a way to express your personality with elegance."
      />

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 md:grid-cols-2 md:px-6">
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border">
          <Image
            src={about}
            alt="A curated selection of Nyra Jewellery pieces"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div>
          <SectionHeading eyebrow="Since day one" title="A passion for timeless elegance" />
          <div className="mt-5 space-y-4 leading-relaxed text-muted-foreground text-pretty">
            <p>
              What began as a small, carefully chosen collection has grown into a boutique loved by women across
              Algeria. We believe jewelry is more than an accessory — it is a way of expressing your personality with
              style.
            </p>
            <p>
              Our mission is to offer a selection of modern stainless steel jewelry, combining quality, refinement and
              accessible prices. We choose every model with care to bring you collections suited to both everyday life
              and special occasions.
            </p>
          </div>
          <Link
            href="/shop"
            className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Explore the collection
          </Link>
        </div>
      </section>

      <section className="bg-secondary/50 py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <SectionHeading eyebrow="Our Promise" title="Why women choose Nyra" align="center" />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-3xl border border-border bg-card p-6 text-center shadow-sm">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <v.icon className="size-6" />
                </div>
                <h3 className="mt-4 font-serif text-lg">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
