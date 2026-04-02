import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import {
  RiArchiveFill,
  RiBarChartBoxFill,
  RiFileListFill,
  RiArrowRightSLine,
  RiInboxLine,
  RiAlertFill,
} from 'react-icons/ri'

const quickLinks = [
  { href: '/admin/products', label: '商品を追加',   icon: RiArchiveFill },
  { href: '/admin/stock',    label: '入出庫管理',   icon: RiBarChartBoxFill },
  { href: '/admin/orders',   label: '発注書を作成', icon: RiFileListFill },
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

      {/* 2カラム */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

        {/* クイックアクション */}
        <div
          className="rounded-2xl p-5 flex flex-col gap-4"
          style={{
            background: 'rgba(28, 39, 49, 0.6)',
            border:     '1px solid rgba(129, 236, 255, 0.12)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <p
            className="text-sm font-semibold"
            style={{ color: '#81ecff', textShadow: '0 0 8px rgba(129,236,255,0.4)', fontFamily: 'var(--font-space-grotesk, system-ui)', letterSpacing: '0.05em' }}
          >
            クイックアクション
          </p>
          <div className="flex flex-col gap-1">
            {quickLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all hover:bg-[rgba(129,236,255,0.06)] group"
                style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-space-grotesk, system-ui)' }}
              >
                <span className="flex items-center gap-2.5">
                  <Icon size={15} style={{ color: 'var(--text-muted)' }} />
                  {label}
                </span>
                <RiArrowRightSLine size={15} className="opacity-30 group-hover:opacity-70 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>

        {/* アクティビティ */}
        <div
          className="rounded-2xl p-5 flex flex-col gap-4 sm:col-span-2"
          style={{
            background: 'var(--bg-surface)',
            border:     '1px solid var(--border)',
          }}
        >
          <div className="flex items-center justify-between">
            <p
              className="text-sm font-semibold"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-space-grotesk, system-ui)' }}
            >
              最近のアクティビティ
            </p>
            <button className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
              すべて見る
            </button>
          </div>
          <div
            className="flex-1 flex flex-col items-center justify-center py-8 rounded-xl gap-2"
            style={{ background: 'var(--bg-base)' }}
          >
            <RiInboxLine size={24} style={{ color: 'var(--text-muted)' }} />
            <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
              まだデータがありません
            </p>
          </div>
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
