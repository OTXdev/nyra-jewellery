"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect } from "react"
import { Gem, HandHeart, ShieldCheck, Truck } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { SectionHeading } from "@/components/ui/section-heading"
import { fetchSiteSettings } from "@/lib/api"
import { setSiteImages, useSiteImages } from "@/lib/site-images"

const VALUES = [
  { icon: Gem, title: "Sélection soignée", text: "Chaque pièce est choisie avec soin pour sa qualité, son design et ses finitions raffinées." },
  { icon: HandHeart, title: "Élégance au quotidien", text: "Des créations modernes et intemporelles pensées pour accompagner votre style en toute occasion." },
  { icon: ShieldCheck, title: "Qualité & raffinement", text: "Des bijoux modernes en acier inoxydable avec de superbes finitions or et argent." },
  { icon: Truck, title: "Paiement à la livraison", text: "Commandez en toute confiance et payez à la réception de votre commande." },
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
        // ignore fetch errors — the about image is only shown once uploaded
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <div>
      <PageHeader
        eyebrow="Notre histoire"
        title="Une boutique passionnée de bijoux"
        description="Chez Nyra Jewellery, nous croyons que chaque bijou est bien plus qu'un simple accessoire — c'est une façon d'exprimer votre personnalité avec élégance."
      />

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 md:grid-cols-2 md:px-6">
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border">
          {about && (
            <Image
              src={about}
              alt="Une sélection de pièces Nyra Jewellery"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          )}
        </div>
        <div>
          <SectionHeading eyebrow="Depuis le premier jour" title="Une passion pour l'élégance intemporelle" />
          <div className="mt-5 space-y-4 leading-relaxed text-muted-foreground text-pretty">
            <p>
              Ce qui a commencé comme une petite collection soigneusement choisie est devenu une boutique adorée par les
              femmes à travers l&apos;Algérie. Nous croyons que le bijou est plus qu&apos;un accessoire — c&apos;est une
              façon d&apos;exprimer votre personnalité avec style.
            </p>
            <p>
              Notre mission est d&apos;offrir une sélection de bijoux modernes en acier inoxydable, alliant qualité,
              raffinement et prix accessibles. Nous choisissons chaque modèle avec soin pour vous proposer des
              collections adaptées à la vie quotidienne comme aux grandes occasions.
            </p>
          </div>
          <Link
            href="/shop"
            className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Explorer la collection
          </Link>
        </div>
      </section>

      <section className="bg-secondary/50 py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <SectionHeading eyebrow="Notre promesse" title="Pourquoi les femmes choisissent Nyra" align="center" />
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
