import Image from 'next/image'
import { BRAND } from '@/lib/data'
import { Instagram } from '@/components/icons/brand-icons'

const IMAGES = [
  '/images/ring-pearl.png',
  '/images/necklace-pearl.png',
  '/images/bracelet-charm.png',
  '/images/ring-emerald.png',
  '/images/set-pearl.png',
  '/images/bracelet-tennis.png',
]

export function InstagramGallery() {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-6">
      {IMAGES.map((src, i) => (
        <a
          key={i}
          href={BRAND.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative aspect-square overflow-hidden rounded-2xl border border-border"
        >
          <Image
            src={src || '/placeholder.svg'}
            alt="Nyra Jewellery on Instagram"
            fill
            sizes="(max-width: 1024px) 33vw, 16vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-primary/40 opacity-0 transition-opacity group-hover:opacity-100">
            <Instagram className="size-6 text-primary-foreground" />
          </span>
        </a>
      ))}
    </div>
  )
}
