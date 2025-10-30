import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { Navigation } from '@/components/Navigation'

export const metadata: Metadata = {
  title: 'Guerreiros do Segundo Lugar',
  description: 'Track and visualize Commander (EDH) games among friends',
  viewport: 'width=device-width, initial-scale=1',
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