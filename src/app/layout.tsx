import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Noto_Sans_JP, Silkscreen } from 'next/font/google'
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

export const metadata: Metadata = {
  title: 'graff.bms',
  description: '統合管理システム — 在庫 / メニュー / 発注',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={`${notoSans.variable} ${silkscreen.variable}`}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
