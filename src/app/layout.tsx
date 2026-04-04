import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Noto_Sans_JP, Silkscreen, Space_Grotesk, JetBrains_Mono, Doto, Shippori_Mincho } from 'next/font/google'
import { SwRegister } from '@/components/admin/SwRegister'
import './globals.css'

const notoSans = Noto_Sans_JP({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
})

const silkscreen = Silkscreen({
  variable: '--font-silkscreen',
  subsets: ['latin'],
  weight: '400',
})

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['400', '700'],
})

const doto = Doto({
  variable: '--font-doto',
  subsets: ['latin'],
  weight: ['400', '700', '900'],
})

const shipporiMincho = Shippori_Mincho({
  variable: '--font-shippori',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
})

export const metadata: Metadata = {
  title:       'graff.bms',
  description: '統合管理システム — 在庫 / メニュー / 発注',
  manifest:    '/manifest.webmanifest',
  appleWebApp: {
    capable:           true,
    title:             'graff.bms',
    statusBarStyle:    'black-translucent',
  },
}

export const viewport: Viewport = {
  themeColor:          '#080f16',
  width:               'device-width',
  initialScale:        1,
  viewportFit:         'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={`${notoSans.variable} ${silkscreen.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${doto.variable} ${shipporiMincho.variable}`}>
      <body>
        <div className="noise-overlay" />
        {children}
        <SwRegister />
        <Analytics />
      </body>
    </html>
  )
}
