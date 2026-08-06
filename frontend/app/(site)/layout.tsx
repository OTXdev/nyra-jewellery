import type { ReactNode } from 'react'
import { Footer } from '@/components/layout/footer'
import { FloatingActions } from '@/components/layout/floating-actions'
import { Navbar } from '@/components/layout/navbar'

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <FloatingActions />
    </>
  )
}
