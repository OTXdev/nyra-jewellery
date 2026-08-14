import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Poppins } from 'next/font/google'
import './globals.css'
import { StoreProvider } from '@/components/store/store-provider'
import { SITE_URL } from '@/lib/seo'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Nyra Jewellery — Bijoux modernes en acier inoxydable',
  description:
    'Découvrez Nyra Jewellery : bagues, colliers, bracelets et ensembles élégants en acier inoxydable moderne. Parcourez la collection, commandez, et laissez-nous gérer le reste.',
  generator: 'v0.app',
  keywords: [
    'Nyra Jewellery',
    'bijoux en acier inoxydable',
    'bagues',
    'colliers',
    'bracelets',
    'ensemble de bijoux',
    'bijoux Algérie',
  ],
  openGraph: {
    title: 'Nyra Jewellery — Bijoux modernes en acier inoxydable',
    description:
      'Bagues, colliers, bracelets et ensembles élégants en acier inoxydable moderne. Parcourez et commandez votre commande.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f4dfe0',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={`${playfair.variable} ${poppins.variable} bg-background`}>
      <body className="font-sans antialiased">
        <StoreProvider>{children}</StoreProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

