'use client'

import { ArrowUp, MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { BRAND } from '@/lib/data'
import { cn } from '@/lib/utils'

export function FloatingActions() {
  const [showTop, setShowTop] = useState(false)

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="fixed bottom-5 right-4 z-40 flex flex-col items-center gap-3 sm:bottom-8 sm:right-6">
      <button
        aria-label="Remonter en haut"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={cn(
          'flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-lg transition-all duration-300 hover:bg-secondary',
          showTop
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-4 opacity-0',
        )}
      >
        <ArrowUp className="size-5" />
      </button>
      <a
        href={`https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(
          'Bonjour Nyra Jewellery, j’ai une question à propos de vos pièces.',
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Discuter sur WhatsApp"
        className="flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition-transform hover:scale-105"
      >
        <MessageCircle className="size-7" />
      </a>
    </div>
  )
}
