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
    { label: '総商品数',     value: productCount  ?? '—', sub: '商品マスタ' },
    { label: '在庫なし',     value: lowStockCount ?? '—', sub: '要確認' },
    { label: '発注件数',     value: orderCount    ?? '—', sub: '累計' },
    { label: '価格アラート', value: alertCount    ?? '—', sub: '未読' },
  ]

  return (
    <div className="max-w-4xl space-y-6">

      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          こんにちは
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          graff.bms 管理パネル
        </p>
      </div>

      {/* 統計グリッド */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ label, value, sub }) => (
          <div
            key={label}
            className="rounded-2xl p-4 flex flex-col gap-2"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {value}
            </p>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* 2カラム */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

        {/* クイックアクション */}
        <div
          className="rounded-2xl p-5 flex flex-col gap-4"
          style={{ background: 'var(--bg-dark)', boxShadow: 'var(--shadow-md)' }}
        >
          <p className="text-sm font-semibold" style={{ color: 'var(--text-invert)' }}>
            クイックアクション
          </p>
          <div className="flex flex-col gap-2">
            {quickLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all hover:bg-white/10 group"
                style={{ color: 'rgba(255,255,255,0.7)' }}
              >
                <span className="flex items-center gap-2.5">
                  <Icon size={15} style={{ color: 'rgba(255,255,255,0.5)' }} />
                  {label}
                </span>
                <RiArrowRightSLine size={15} className="opacity-40 group-hover:opacity-80 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>

        {/* アクティビティ */}
        <div
          className="rounded-2xl p-5 flex flex-col gap-4 sm:col-span-2"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
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
          style={{ background: '#d84f2a', display: 'flex' }}
        >
          <RiAlertFill size={16} style={{ color: '#fff', flexShrink: 0 }} />
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: '#fff' }}>価格上昇注意</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.75)' }}>
              前回比 5% 以上の値上がりが {alertCount} 件あります
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl flex-shrink-0" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
            確認する →
          </span>
        </Link>
      )}

    </div>
  )
}
