'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Search, ShoppingBag, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useStore } from '@/components/store/store-provider'
import { Logo } from './logo'
import { SearchDialog } from './search-dialog'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/', label: 'Accueil' },
  { href: '/shop', label: 'Boutique' },
  { href: '/collections', label: 'Collections' },
  { href: '/promotions', label: 'Promotions' },
  { href: '/about', label: 'À propos' },
  { href: '/contact', label: 'Contact' },
]

export function Navbar() {
  const pathname = usePathname()
  const { cartCount, hydrated } = useStore()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-300',
          scrolled
            ? 'border-b border-border/70 bg-background/85 backdrop-blur-md shadow-sm'
            : 'bg-transparent',
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <button
              aria-label="Ouvrir le menu"
              onClick={() => setMenuOpen(true)}
              className="rounded-full p-1.5 text-foreground transition-colors hover:bg-secondary"
            >
              <Menu className="size-6" />
            </button>
          </div>

          <Logo className="lg:flex-none" />

          <nav className="hidden items-center gap-8 lg:flex">
            {LINKS.map((link) => {
              const active =
                link.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'relative text-sm font-medium tracking-wide transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-px after:bg-accent after:transition-all',
                    active
                      ? 'text-primary after:w-full'
                      : 'text-foreground/70 after:w-0 hover:text-primary hover:after:w-full',
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              aria-label="Rechercher"
              onClick={() => setSearchOpen(true)}
              className="rounded-full p-2 text-foreground transition-colors hover:bg-secondary"
            >
              <Search className="size-5" />
            </button>
            <Link
              href="/cart"
              aria-label="Voir le panier"
              className="relative rounded-full p-2 text-foreground transition-colors hover:bg-secondary"
            >
              <ShoppingBag className="size-5" />
              {hydrated && cartCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-wine text-[0.65rem] font-semibold text-wine-foreground">
                  {cartCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-0 z-[55] lg:hidden',
          menuOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
      >
        <div
          className={cn(
            'absolute inset-0 bg-primary/40 backdrop-blur-sm transition-opacity',
            menuOpen ? 'opacity-100' : 'opacity-0',
          )}
          onClick={() => setMenuOpen(false)}
        />
        <div
          className={cn(
            'absolute left-0 top-0 flex h-full w-72 max-w-[80%] flex-col gap-2 bg-card p-6 shadow-2xl transition-transform duration-300',
            menuOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="mb-6 flex items-center justify-between">
            <Logo />
            <button
              aria-label="Fermer le menu"
              onClick={() => setMenuOpen(false)}
              className="rounded-full p-1.5 text-foreground transition-colors hover:bg-secondary"
            >
              <X className="size-6" />
            </button>
          </div>
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-xl px-3 py-2.5 text-base font-medium text-foreground transition-colors hover:bg-secondary"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
