import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Poppins } from 'next/font/google'
import './globals.css'
import { StoreProvider } from '@/components/store/store-provider'

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
  title: 'Nyra Jewellery — Modern Stainless Steel Jewelry',
  description:
    'Discover Nyra Jewellery: elegant rings, necklaces, bracelets and jewelry sets in modern stainless steel. Browse the collection, request your order, and let us handle the rest.',
  generator: 'v0.app',
  keywords: [
    'Nyra Jewellery',
    'stainless steel jewelry',
    'rings',
    'necklaces',
    'bracelets',
    'jewelry sets',
    'Algeria jewelry',
  ],
  openGraph: {
    title: 'Nyra Jewellery — Modern Stainless Steel Jewelry',
    description:
      'Elegant rings, necklaces, bracelets and jewelry sets in modern stainless steel. Browse and request your order.',
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
    <html lang="en" className={`${playfair.variable} ${poppins.variable} bg-background`}>
      <body className="font-sans antialiased">
        <StoreProvider>{children}</StoreProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
