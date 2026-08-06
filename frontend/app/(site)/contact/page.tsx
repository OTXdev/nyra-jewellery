import type { Metadata } from "next"
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { ContactForm } from "@/components/contact/contact-form"
import { BRAND } from "@/lib/data"

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Nyra Jewellery. Reach us by WhatsApp, phone or email.",
}

export default function ContactPage() {
  const waLink = `https://wa.me/${BRAND.whatsapp}`
  return (
    <div>
      <PageHeader
        eyebrow="We&apos;re here to help"
        title="Contact Us"
        description="Questions about a piece, an order or delivery? Reach out — we&apos;d love to hear from you."
      />

      <section className="mx-auto grid max-w-6xl gap-8 px-4 pb-20 md:grid-cols-[1fr_1.4fr] md:px-6">
        <div className="space-y-4">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-4 rounded-3xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MessageCircle className="size-5" />
            </span>
            <div>
              <p className="font-medium">WhatsApp</p>
              <p className="text-sm text-muted-foreground">{BRAND.whatsappDisplay}</p>
              <p className="mt-1 text-xs text-primary">Fastest way to reach us</p>
            </div>
          </a>

          <div className="flex items-start gap-4 rounded-3xl border border-border bg-card p-5 shadow-sm">
            <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Phone className="size-5" />
            </span>
            <div>
              <p className="font-medium">Phone</p>
              <p className="text-sm text-muted-foreground">{BRAND.whatsappDisplay}</p>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-3xl border border-border bg-card p-5 shadow-sm">
            <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Mail className="size-5" />
            </span>
            <div>
              <p className="font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{BRAND.email}</p>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-3xl border border-border bg-card p-5 shadow-sm">
            <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MapPin className="size-5" />
            </span>
            <div>
              <p className="font-medium">Location</p>
              <p className="text-sm text-muted-foreground">Alger, Algeria — delivery nationwide</p>
            </div>
          </div>
        </div>

        <ContactForm />
      </section>
    </div>
  )
}
