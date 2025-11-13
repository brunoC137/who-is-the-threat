import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { Navigation } from '@/components/Navigation'

export const metadata: Metadata = {
  title: {
    default: 'Guerreiros do Segundo Lugar',
    template: '%s | Guerreiros do Segundo Lugar'
  },
  description: 'Track and visualize Commander (EDH) games among friends. Manage your decks, record game results, and view statistics.',
  keywords: ['Commander', 'EDH', 'Magic the Gathering', 'MTG', 'Game Tracker', 'Deck Management'],
  authors: [{ name: 'Guerreiros do Segundo Lugar' }],
  creator: 'Guerreiros do Segundo Lugar',
  publisher: 'Guerreiros do Segundo Lugar',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
    ],
  },
  manifest: '/site.webmanifest',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://guerreiros-do-segundo-lugar.vercel.app',
    title: 'Guerreiros do Segundo Lugar',
    description: 'Track and visualize Commander (EDH) games among friends',
    siteName: 'Guerreiros do Segundo Lugar',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Guerreiros do Segundo Lugar',
    description: 'Track and visualize Commander (EDH) games among friends',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="font-sans">
        <Providers>
          <Navigation>
            {children}
          </Navigation>
        </Providers>
      </body>
    </html>
  )
}