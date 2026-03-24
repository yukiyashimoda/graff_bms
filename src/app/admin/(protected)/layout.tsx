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
  RiBuildingFill,
  RiPriceTag3Fill,
  RiHistoryFill,
  RiClipboardLine,
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
  { href: '/admin/products',         label: '商品管理',       icon: RiArchiveFill },
  { href: '/admin/stock',            label: '入出庫管理',     icon: RiBarChartBoxFill },
  { href: '/admin/stock/history',    label: '入出庫履歴',     icon: RiHistoryFill },
  { href: '/admin/orders',           label: '発注管理',       icon: RiFileListFill },
  { href: '/admin/orders/history',   label: '発注履歴',       icon: RiHistoryFill },
  { href: '/admin/suppliers',        label: '発注先管理',     icon: RiBuildingFill },
  { href: '/admin/pricing',          label: '原価計算',       icon: RiPriceTag3Fill },
  { href: '/admin/inventory',        label: '棚卸し管理',     icon: RiClipboardLine },
]

function PublicPageSection() {
  const [open,          setOpen]          = useState(false)
  const [selectedLocale, setSelectedLocale] = useState<string | null>(null)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150"
        style={{ color: 'var(--text-secondary)' }}
      >
        <RiStoreFill size={15} />
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
          style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}
        >
          {/* ロケール選択 */}
          <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
            {LOCALES.map(l => (
              <button
                key={l.code}
                onClick={() => setSelectedLocale(l.code)}
                className="flex-1 py-1.5 text-[11px] font-medium transition-colors"
                style={{
                  background: selectedLocale === l.code ? 'var(--bg-dark)' : 'transparent',
                  color:      selectedLocale === l.code ? 'var(--text-invert)' : 'var(--text-muted)',
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
                  fgColor="#1e1e1c"
                  level="M"
                />
              </div>
              <a
                href={`/${selectedLocale}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 w-full justify-center py-2 rounded-lg text-[12px] font-semibold transition-colors hover:opacity-80"
                style={{ background: 'var(--bg-dark)', color: 'var(--text-invert)' }}
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
      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150"
      style={{
        background: active ? 'var(--bg-dark)' : 'transparent',
        color:      active ? 'var(--text-invert)' : 'var(--text-secondary)',
      }}
    >
      <Icon size={15} />
      {label}
    </Link>
  )
}

function SidebarContent({ pathname, onNav }: { pathname: string; onNav: () => void }) {
  return (
    <>
      {/* スクロール可能エリア */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-1 min-h-0">
        {/* ロゴ */}
        <div className="flex items-center gap-2 px-3 mb-5">
          <div
            className="w-11 h-11 rounded-lg flex items-center justify-center text-lg"
            style={{ background: 'var(--bg-dark)', color: 'var(--text-invert)', fontFamily: 'var(--font-silkscreen)' }}
          >
            g
          </div>
          <span className="text-[18px]" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-silkscreen)' }}>
            graff.bms
          </span>
        </div>

        {/* メインナビ */}
        <p className="text-[10px] font-semibold tracking-widest uppercase px-3 mb-1"
           style={{ color: 'var(--text-muted)' }}>
          メニュー
        </p>
        {mainNav.map(item => (
          <NavItem key={item.href} {...item} active={pathname === item.href} onClick={onNav} />
        ))}

        {/* 公開ページ */}
        <div className="mt-4">
          <p className="text-[10px] font-semibold tracking-widest uppercase px-3 mb-1"
             style={{ color: 'var(--text-muted)' }}>
            公開
          </p>
          <PublicPageSection />
        </div>
      </div>

      {/* ログアウト（常に下部固定） */}
      <div className="flex-shrink-0 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
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
        style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}
      >
        <SidebarContent pathname={pathname} onNav={() => {}} />
      </aside>

      {/* ━━━ Sidebar (mobile overlay) ━━━ */}
      {open && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.45)' }}
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
        style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}
      >
        {/* 閉じるボタン */}
        <button
          onClick={close}
          className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-base)]"
          style={{ color: 'var(--text-muted)' }}
        >
          <RiCloseFill size={18} />
        </button>
        <SidebarContent pathname={pathname} onNav={close} />
      </aside>

      {/* ━━━ Main ━━━ */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* トップバー */}
        <header
          className="h-14 flex items-center justify-between px-4 lg:px-6 gap-3"
          style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}
        >
          {/* ハンバーガー（モバイルのみ） */}
          <button
            onClick={() => setOpen(true)}
            className="lg:hidden p-2 rounded-xl transition-colors hover:bg-[var(--bg-base)] flex-shrink-0"
            style={{ color: 'var(--text-secondary)' }}
          >
            <RiMenuFill size={18} />
          </button>

          {/* 検索 */}
          <div
            className="hidden sm:flex items-center gap-2 px-3 h-9 rounded-xl text-sm w-56"
            style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            <RiSearchLine size={14} />
            <span className="text-[13px]">検索...</span>
          </div>

          {/* 右側 */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-[var(--bg-base)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              <RiBellFill size={17} />
            </button>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
              style={{ background: 'var(--bg-dark)', color: 'var(--text-invert)' }}
            >
              <RiUserFill size={14} />
            </div>
          </div>
        </header>

        {/* コンテンツ */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
