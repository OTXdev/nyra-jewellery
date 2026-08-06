'use client'

import Link from 'next/link'
import { Mail, MapPin, Phone } from 'lucide-react'
import { useEffect, useState } from 'react'
import { BRAND } from '@/lib/data'
import { TikTok, Instagram } from '@/components/icons/brand-icons'
import { fetchSiteSettings, type SiteSettings } from '@/lib/api'

export function Footer() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)

  useEffect(() => {
    fetchSiteSettings()
      .then(setSettings)
      .catch(() => {
        // Fall back to static BRAND constants if the API is unavailable.
      })
  }, [])

  // Use API data when available, fall back to BRAND constants.
  const phone = settings?.phone || BRAND.whatsapp
  const phoneDisplay = settings?.phone_display || BRAND.whatsappDisplay
  const email = settings?.email || BRAND.email
  const address = settings?.address || 'Alger, Algeria'
  const instagram = settings?.instagram || BRAND.instagram
  const tiktok = settings?.tiktok || BRAND.tiktok

  return (
    <footer className="mt-24 border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <span className="font-serif text-3xl font-semibold tracking-wide">
              Nyra
            </span>
            <span className="mt-1 block text-[0.6rem] uppercase tracking-[0.35em] text-primary-foreground/70">
              Jewellery
            </span>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-primary-foreground/80">
              Modern stainless steel jewelry, thoughtfully selected for the
              moments that matter. Browse, request, and let us take care of
              the rest.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-widest text-accent">
              Explore
            </h4>
            <ul className="space-y-2.5 text-sm text-primary-foreground/80">
              {[
                { href: '/shop', label: 'Shop All' },
                { href: '/collections', label: 'Collections' },
                { href: '/promotions', label: 'Promotions' },
                { href: '/about', label: 'About Us' },
                { href: '/contact', label: 'Contact' },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="transition-colors hover:text-accent"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-widest text-accent">
              Get in touch
            </h4>
            <ul className="space-y-3 text-sm text-primary-foreground/80">
              <li className="flex items-center gap-2.5">
                <Phone className="size-4 text-accent" />
                <a href={`tel:+${phone}`}>{phoneDisplay}</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="size-4 text-accent" />
                <a href={`mailto:${email}`}>{email}</a>
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin className="size-4 text-accent" />
                <span>{address}</span>
              </li>
            </ul>
            <div className="mt-5 flex gap-3">
              <a
                href={instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="rounded-full border border-primary-foreground/20 p-2 transition-colors hover:border-accent hover:text-accent"
              >
                <Instagram className="size-4" />
              </a>
              <a
                href={tiktok}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="rounded-full border border-primary-foreground/20 p-2 transition-colors hover:border-accent hover:text-accent"
              >
                <TikTok className="size-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-primary-foreground/15 pt-8 text-xs text-primary-foreground/60 sm:flex-row">
          <p>
            © {new Date().getFullYear()} Nyra Jewellery. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
