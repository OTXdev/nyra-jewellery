import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Gem, HandHeart, ShieldCheck, Truck } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { SectionHeading } from "@/components/ui/section-heading"

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Nyra Jewellery crafts timeless, handcrafted pieces with love. Learn about our story, values and promise.",
}

const VALUES = [
  { icon: Gem, title: "Handcrafted Quality", text: "Every piece is finished by hand with careful attention to detail and lasting shine." },
  { icon: HandHeart, title: "Made with Love", text: "We design jewelry meant to be treasured and passed down through generations." },
  { icon: ShieldCheck, title: "Trusted Materials", text: "Premium gold-plated brass, stainless steel and genuine freshwater pearls." },
  { icon: Truck, title: "Cash on Delivery", text: "Order with confidence and pay when your treasure arrives at your door." },
]

export default function AboutPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Our Story"
        title="Jewelry made to be treasured"
        description="Nyra Jewellery was born from a love of timeless elegance and the belief that beautiful jewelry should be accessible to every woman."
      />

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 md:grid-cols-2 md:px-6">
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border">
          <Image
            src="/images/about.png"
            alt="An artisan arranging Nyra Jewellery pieces"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div>
          <SectionHeading eyebrow="Since day one" title="A passion for the timeless" />
          <div className="mt-5 space-y-4 leading-relaxed text-muted-foreground text-pretty">
            <p>
              What began as a small collection of handpicked pieces has grown into a boutique loved by women across
              Algeria. We believe jewelry is more than an accessory — it is a keepsake of life&apos;s most precious
              moments.
            </p>
            <p>
              Each Nyra piece is thoughtfully designed and finished by hand, blending classic silhouettes with a soft,
              feminine touch. From everyday elegance to bridal splendor, we create jewelry you&apos;ll reach for again
              and again.
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
