'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  RiDashboardFill,
  RiArchiveFill,
  RiBarChartBoxFill,
  RiFileListFill,
  RiStoreFill,
  RiBellFill,
  RiSearchLine,
  RiUserFill,
  RiPriceTag3Fill,
  RiClipboardLine,
  RiAlertFill,
  RiSettings3Fill,
  RiMenuFill,
  RiCloseFill,
  RiExternalLinkFill,
  RiArrowDownSLine,
} from 'react-icons/ri'
import dynamic from 'next/dynamic'
const QRCodeSVG = dynamic(() => import('qrcode.react').then(m => m.QRCodeSVG), { ssr: false })
import { LogoutButton } from '@/components/admin/LogoutButton'

const LOCALES = [
  { code: 'ja', label: '日本語' },
  { code: 'en', label: 'English' },
]

const mainNav = [
  { href: '/admin',                  label: 'ダッシュボード', icon: RiDashboardFill },
  { href: '/admin/products',         label: 'メニュー管理',   icon: RiArchiveFill },
  { href: '/admin/stock',            label: '入出庫管理',     icon: RiBarChartBoxFill },
  { href: '/admin/orders',           label: '発注/検品',      icon: RiFileListFill },
  { href: '/admin/pricing',          label: '原価計算',       icon: RiPriceTag3Fill },
  { href: '/admin/inventory',        label: '棚卸',           icon: RiClipboardLine },
  { href: '/admin/alerts',           label: '価格アラート',   icon: RiAlertFill },
  { href: '/admin/settings',         label: '設定',           icon: RiSettings3Fill },
]

const bottomNav = [
  { href: '/admin',          label: 'Home',     icon: RiDashboardFill },
  { href: '/admin/products', label: 'Products', icon: RiArchiveFill },
  { href: '/admin/stock',    label: 'Stock',    icon: RiBarChartBoxFill },
  { href: '/admin/orders',   label: 'Orders',   icon: RiFileListFill },
  { href: '/admin/settings', label: 'Settings', icon: RiSettings3Fill },
]

function isActive(pathname: string, href: string) {
  return href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
}

function PublicPageSection() {
  const [open,           setOpen]          = useState(false)
  const [selectedLocale, setSelectedLocale] = useState<string | null>(null)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150"
        style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-space-grotesk, system-ui)', letterSpacing: '0.05em' }}
      >
        <RiStoreFill size={15} className="flex-shrink-0" />
        <span className="flex-1 text-left">公開ページ</span>
        <RiArrowDownSLine
          size={14}
          style={{
            transition: 'transform 0.2s',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            color: 'var(--text-muted)',
          }}
        />
      </button>

      {open && (
        <div
          className="mx-2 mt-1 rounded-xl overflow-hidden"
          style={{ background: 'rgba(28,39,49,0.6)', border: '1px solid rgba(129,236,255,0.12)' }}
        >
          {/* ロケール選択 */}
          <div className="flex border-b" style={{ borderColor: 'rgba(129,236,255,0.08)' }}>
            {LOCALES.map(l => (
              <button
                key={l.code}
                onClick={() => setSelectedLocale(l.code)}
                className="flex-1 py-1.5 text-[11px] font-medium transition-colors"
                style={{
                  background: selectedLocale === l.code ? 'rgba(129,236,255,0.1)' : 'transparent',
                  color:      selectedLocale === l.code ? '#81ecff' : 'var(--text-muted)',
                }}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* QRコード */}
          {selectedLocale ? (
            <div className="flex flex-col items-center gap-3 p-3">
              <div
                className="p-2 rounded-lg"
                style={{ background: '#fff' }}
              >
                <QRCodeSVG
                  value={`${origin}/${selectedLocale}`}
                  size={120}
                  bgColor="#ffffff"
                  fgColor="#080f16"
                  level="M"
                />
              </div>
              <a
                href={`/${selectedLocale}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 w-full justify-center py-2 rounded-lg text-[12px] font-semibold transition-opacity hover:opacity-80"
                style={{ background: 'rgba(129,236,255,0.1)', color: '#81ecff', border: '1px solid rgba(129,236,255,0.2)' }}
              >
                <RiExternalLinkFill size={12} />
                ページを開く
              </a>
            </div>
          ) : (
            <p className="text-[11px] text-center py-3" style={{ color: 'var(--text-muted)' }}>
              言語を選択してください
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function NavItem({
  href, label, icon: Icon, active, onClick,
}: { href: string; label: string; icon: React.ElementType; active: boolean; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150"
      style={{
        background:  active ? 'rgba(129, 236, 255, 0.08)' : 'transparent',
        color:       active ? '#81ecff' : 'var(--text-secondary)',
        border:      active ? '1px solid rgba(129, 236, 255, 0.15)' : '1px solid transparent',
        textShadow:  active ? '0 0 8px rgba(129, 236, 255, 0.5)' : 'none',
        fontFamily:  'var(--font-space-grotesk, system-ui)',
        letterSpacing: '0.05em',
      }}
    >
      <Icon
        size={15}
        className="flex-shrink-0"
        style={{ filter: active ? 'drop-shadow(0 0 4px rgba(129,236,255,0.8))' : 'none' }}
      />
      {label}
    </Link>
  )
}

function SidebarContent({ pathname, onNav }: { pathname: string; onNav: () => void }) {
  return (
    <>
      <div className="flex-1 overflow-y-auto flex flex-col gap-1 min-h-0">
        {/* ロゴ */}
        <div className="flex items-center gap-2 px-3 mb-6">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-base border"
            style={{
              background:  'rgba(129, 236, 255, 0.08)',
              color:       '#81ecff',
              borderColor: 'rgba(129, 236, 255, 0.2)',
              fontFamily:  'var(--font-silkscreen)',
              filter:      'drop-shadow(0 0 6px rgba(129,236,255,0.4))',
            }}
          >
            g
          </div>
          <span
            className="text-[20px] tracking-widest uppercase"
            style={{
              color:      '#81ecff',
              fontFamily: 'var(--font-silkscreen)',
              fontWeight: 700,
              textShadow: '0 0 8px rgba(129,236,255,0.5)',
            }}
          >
            graff.bms
          </span>
        </div>

        {/* ナビ上部ラベル */}
        <p
          className="text-[9px] font-semibold tracking-[0.25em] uppercase px-3 mb-1"
          style={{ color: 'var(--text-muted)' }}
        >
          Navigation
        </p>

        {mainNav.map(item => (
          <NavItem
            key={item.href}
            {...item}
            active={isActive(pathname, item.href)}
            onClick={onNav}
          />
        ))}

        {/* 公開ページ */}
        <div className="mt-4">
          <p
            className="text-[9px] font-semibold tracking-[0.25em] uppercase px-3 mb-1"
            style={{ color: 'var(--text-muted)' }}
          >
            Public
          </p>
          <PublicPageSection />
        </div>
      </div>

      {/* ログアウト（常に下部固定） */}
      <div
        className="flex-shrink-0 pt-3"
        style={{ borderTop: '1px solid rgba(129, 236, 255, 0.08)' }}
      >
        <LogoutButton />
      </div>
    </>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const close = () => setOpen(false)

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>

      {/* ━━━ Sidebar (desktop) ━━━ */}
      <aside
        className="hidden lg:flex w-52 flex-shrink-0 flex-col py-5 px-3 gap-1 h-screen sticky top-0"
        style={{
          background:     'rgba(8, 15, 22, 0.9)',
          backdropFilter: 'blur(12px)',
          borderRight:    '1px solid rgba(129, 236, 255, 0.1)',
        }}
      >
        <SidebarContent pathname={pathname} onNav={() => {}} />
      </aside>

      {/* ━━━ Sidebar (mobile overlay) ━━━ */}
      {open && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={close}
        />
      )}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-60 flex flex-col py-5 px-3 gap-1
          transition-transform duration-200
          lg:hidden
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          background:  'rgba(8, 15, 22, 0.97)',
          borderRight: '1px solid rgba(129, 236, 255, 0.12)',
        }}
      >
        {/* 閉じるボタン */}
        <button
          onClick={close}
          className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors hover:bg-[rgba(129,236,255,0.08)]"
          style={{ color: 'var(--text-muted)' }}
        >
          <RiCloseFill size={18} />
        </button>
        <SidebarContent pathname={pathname} onNav={close} />
      </aside>

      {/* ━━━ Main ━━━ */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* トップバー */}
        <header
          className="h-16 flex items-center justify-between px-4 lg:px-6 gap-3 sticky top-0 z-30"
          style={{
            background:          'rgba(8, 15, 22, 0.45)',
            backdropFilter:      'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            boxShadow:           '0 2px 40px rgba(0, 0, 0, 0.25)',
          }}
        >
          {/* ハンバーガー＋ロゴ（モバイルのみ） */}
          <div className="lg:hidden flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setOpen(true)}
              className="p-2 rounded-lg transition-colors hover:bg-[rgba(129,236,255,0.08)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              <RiMenuFill size={18} />
            </button>
            <span
              className="text-[20px]"
              style={{
                color:      '#81ecff',
                fontFamily: 'var(--font-silkscreen)',
                fontWeight: 700,
                textShadow: '0 0 8px rgba(129,236,255,0.5)',
              }}
            >
              graff.bms
            </span>
          </div>

          {/* 検索（デスクトップ） */}
          <div
            className="hidden lg:flex items-center gap-2 px-3 h-9 rounded-lg text-sm w-56"
            style={{
              background: 'rgba(28, 39, 49, 0.4)',
              border:     '1px solid rgba(129, 236, 255, 0.1)',
              color:      'var(--text-muted)',
            }}
          >
            <RiSearchLine size={14} />
            <span className="text-[12px] uppercase tracking-widest" style={{ fontFamily: 'var(--font-space-grotesk, system-ui)' }}>
              Search...
            </span>
          </div>

          {/* 右側 */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-[rgba(129,236,255,0.08)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              <RiBellFill size={17} />
            </button>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
              style={{
                background: 'rgba(129, 236, 255, 0.1)',
                color:      '#81ecff',
                border:     '1px solid rgba(129, 236, 255, 0.2)',
              }}
            >
              <RiUserFill size={14} />
            </div>
          </div>
        </header>

        {/* コンテンツ */}
        <main className="flex-1 p-4 pb-28 lg:p-6 lg:pb-6">
          {children}
        </main>
      </div>

      {/* ━━━ ボトムナビ（モバイルのみ） ━━━ */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex"
        style={{
          background:          'rgba(8, 15, 22, 0.45)',
          backdropFilter:      'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          boxShadow:           '0 -4px 30px rgba(0, 0, 0, 0.3)',
          paddingBottom:       'env(safe-area-inset-bottom)',
        }}
      >
        {bottomNav.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all active:scale-90 relative"
              style={{
                minHeight: '72px',
                color:  active ? '#81ecff' : 'var(--text-muted)',
                filter: active ? 'drop-shadow(0 0 5px rgba(129,236,255,0.7))' : 'none',
              }}
            >
              {active && (
                <span
                  className="absolute top-0 left-1/4 rounded-b-full"
                  style={{
                    width:      '50%',
                    height:     '2px',
                    background: '#81ecff',
                    boxShadow:  '0 0 8px #81ecff',
                  }}
                />
              )}
              <Icon size={active ? 22 : 20} />
              <span
                className="text-[9px] uppercase tracking-[0.15em]"
                style={{
                  fontFamily: 'var(--font-space-grotesk, system-ui)',
                  fontWeight: active ? 700 : 500,
                }}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
