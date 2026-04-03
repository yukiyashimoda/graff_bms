import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import {
  RiBarChartBoxFill,
  RiFileListFill,
  RiArrowRightSLine,
  RiInboxLine,
  RiAlertFill,
  RiAddBoxLine,
  RiPriceTag3Fill,
} from 'react-icons/ri'

const quickLinks = [
  { href: '/admin/products/new', labelEn: 'New Item', icon: RiAddBoxLine },
  { href: '/admin/stock',        labelEn: 'Stock',    icon: RiBarChartBoxFill },
  { href: '/admin/orders',       labelEn: 'Order',    icon: RiFileListFill },
  { href: '/admin/pricing',      labelEn: 'Price',    icon: RiPriceTag3Fill },
]

export default async function AdminDashboardPage() {
  const supabase = await createServiceClient()

  const [
    { count: productCount },
    { count: lowStockCount },
    { count: orderCount },
    { count: alertCount },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('stock').select('*', { count: 'exact', head: true }).lt('quantity', 1),
    supabase.from('purchase_orders').select('*', { count: 'exact', head: true }),
    supabase.from('price_alerts').select('*', { count: 'exact', head: true }).eq('is_read', false),
  ])

  const stats = [
    { label: '総商品数',     value: productCount  ?? '—', sub: '商品マスタ', href: null,           accent: '#81ecff' },
    { label: '在庫なし',     value: lowStockCount ?? '—', sub: '要確認',     href: null,           accent: '#ff716c' },
    { label: '発注件数',     value: orderCount    ?? '—', sub: '累計',       href: null,           accent: '#70aaff' },
    { label: '価格アラート', value: alertCount    ?? '—', sub: '未読',       href: '/admin/alerts', accent: '#fe9400', alert: (alertCount ?? 0) > 0 },
  ]

  return (
    <div className="max-w-4xl space-y-6">

      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-space-grotesk, system-ui)' }}
        >
          こんにちは
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          graff.bms 管理パネル
        </p>
      </div>

      {/* 統計グリッド */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ label, value, sub, href, accent, alert }) => {
          const card = (
            <div
              className="rounded-2xl p-4 flex flex-col gap-2 h-full"
              style={{
                background: 'var(--bg-surface)',
                border:     alert ? `1px solid ${accent}40` : '1px solid var(--border)',
                boxShadow:  alert ? `0 0 16px ${accent}20` : 'var(--shadow-sm)',
              }}
            >
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
              <p
                className="text-3xl font-bold tracking-tight tabular-nums"
                style={{ color: alert ? accent : 'var(--text-primary)', textShadow: alert ? `0 0 12px ${accent}60` : 'none' }}
              >
                {value}
              </p>
              <p className="text-[11px]" style={{ color: accent + '99' }}>{sub}</p>
            </div>
          )
          return href ? (
            <Link key={label} href={href} className="rounded-2xl transition-opacity hover:opacity-85">
              {card}
            </Link>
          ) : (
            <div key={label}>{card}</div>
          )
        })}
      </div>

      {/* クイックアクション */}
      <section>
        <p
          className="text-[9px] uppercase tracking-[0.25em] mb-3 px-1"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-space-grotesk, system-ui)' }}
        >
          Operations / 操作
        </p>
        <div className="grid grid-cols-4 gap-3">
          {quickLinks.map(({ href, labelEn, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all active:scale-95"
              style={{
                background: 'var(--bg-surface)',
                border:     '1px solid var(--border)',
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(129,236,255,0.08)', border: '1px solid rgba(129,236,255,0.12)' }}
              >
                <Icon size={18} style={{ color: '#81ecff' }} />
              </div>
              <span
                className="text-[9px] text-center uppercase tracking-tight"
                style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-space-grotesk, system-ui)' }}
              >
                {labelEn}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* アクティビティ */}
      <div
        className="rounded-2xl p-5 flex flex-col gap-4"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between">
          <p
            className="text-[9px] uppercase tracking-[0.25em]"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-space-grotesk, system-ui)' }}
          >
            Log Feed / 履歴
          </p>
          <Link
            href="/admin/stock/history"
            className="text-[10px] transition-opacity hover:opacity-70 flex items-center gap-1"
            style={{ color: '#81ecff' }}
          >
            View All <RiArrowRightSLine size={12} />
          </Link>
        </div>
        <div
          className="flex flex-col items-center justify-center py-8 rounded-xl gap-2"
          style={{ background: 'var(--bg-base)' }}
        >
          <RiInboxLine size={24} style={{ color: 'var(--text-muted)' }} />
          <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>No transactions yet</p>
        </div>
      </div>

      {/* 価格上昇注意バナー */}
      {(alertCount ?? 0) > 0 && (
        <Link
          href="/admin/alerts"
          className="rounded-2xl p-4 flex items-center gap-3 transition-opacity hover:opacity-90"
          style={{
            background: 'rgba(254, 148, 0, 0.08)',
            border:     '1px solid rgba(254, 148, 0, 0.3)',
            display:    'flex',
          }}
        >
          <RiAlertFill size={16} style={{ color: '#fe9400', flexShrink: 0, filter: 'drop-shadow(0 0 6px rgba(254,148,0,0.6))' }} />
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: '#fe9400', textShadow: '0 0 8px rgba(254,148,0,0.4)' }}>価格上昇注意</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              前回比 5% 以上の値上がりが {alertCount} 件あります
            </p>
          </div>
          <span
            className="text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0"
            style={{ background: 'rgba(254, 148, 0, 0.15)', color: '#fe9400', border: '1px solid rgba(254,148,0,0.3)' }}
          >
            確認する →
          </span>
        </Link>
      )}

    </div>
  )
}
