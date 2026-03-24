'use client'

import { useState, useMemo } from 'react'
import {
  RiAddBoxFill,
  RiSubtractFill,
  RiEqualizerFill,
  RiSearchLine,
  RiDownloadLine,
  RiFilePdfLine,
} from 'react-icons/ri'

type TxRow = {
  id:               string
  type:             'in' | 'out' | 'adjustment'
  quantity:         number
  cost_price:       number | null
  notes:            string | null
  created_at:       string
  product_name:     string
  product_name_en:  string
  unit:             string
  product_category: string | null
}

const TYPE_LABEL = { in: '入庫', out: '出庫', adjustment: '調整' } as const
const TYPE_ICON  = {
  in:         <RiAddBoxFill   size={11} />,
  out:        <RiSubtractFill size={11} />,
  adjustment: <RiEqualizerFill size={11} />,
}
const TYPE_COLOR = {
  in:         { bg: 'var(--bg-dark)',  color: 'var(--text-invert)' },
  out:        { bg: 'var(--bg-base)',  color: 'var(--text-secondary)' },
  adjustment: { bg: 'var(--bg-base)',  color: 'var(--text-muted)' },
}

function formatJpDate(iso: string) {
  const d = new Date(iso)
  const days = ['日','月','火','水','木','金','土']
  return `${d.getMonth() + 1}月${d.getDate()}日（${days[d.getDay()]}）`
}
function formatTime(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
function monthKey(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}`
}
function monthLabel(key: string) {
  const [y, m] = key.split('-')
  return `${y}年${Number(m)}月`
}
function dayKey(iso: string) {
  return iso.slice(0, 10)
}

function downloadCSV(transactions: TxRow[], month: string) {
  const [y, m] = month.split('-')
  const header = ['日時', '種別', '商品名', '商品名(EN)', '数量', '単位', '単価', '合計', 'メモ']
  const rows = transactions.map(t => [
    t.created_at,
    TYPE_LABEL[t.type],
    t.product_name,
    t.product_name_en,
    t.quantity,
    t.unit,
    t.cost_price ?? '',
    t.cost_price != null ? t.cost_price * t.quantity : '',
    t.notes ?? '',
  ])
  const csv = [header, ...rows]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `stock-history-${y}-${m}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function HistoryClient({ transactions }: { transactions: TxRow[] }) {
  const [query,       setQuery]      = useState('')
  const [typeFilter,  setTypeFilter] = useState<'in' | 'out' | 'adjustment' | null>(null)
  const [catFilter,   setCat]        = useState<string | null>(null)
  const [activeMonth, setActiveMonth] = useState<string | null>(null)

  const categories = useMemo(() => {
    const seen = new Set<string>()
    return transactions
      .map(t => t.product_category)
      .filter((c): c is string => !!c && !seen.has(c) && !!seen.add(c))
      .sort()
  }, [transactions])

  // 月一覧
  const months = useMemo(() => {
    const seen = new Set<string>()
    transactions.forEach(t => seen.add(monthKey(t.created_at)))
    const list = Array.from(seen).sort().reverse()
    return list
  }, [transactions])

  const selectedMonth = activeMonth ?? months[0] ?? null

  // サマリー（選択月）
  const monthlySummary = useMemo(() => {
    const txs = transactions.filter(t => monthKey(t.created_at) === selectedMonth)
    return {
      inCount:   txs.filter(t => t.type === 'in').length,
      outCount:  txs.filter(t => t.type === 'out').length,
      adjCount:  txs.filter(t => t.type === 'adjustment').length,
      inCost:    txs.filter(t => t.type === 'in' && t.cost_price != null)
                   .reduce((s, t) => s + (t.cost_price ?? 0) * t.quantity, 0),
    }
  }, [transactions, selectedMonth])

  // フィルタ後のデータ（選択月）
  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (monthKey(t.created_at) !== selectedMonth) return false
      if (typeFilter && t.type !== typeFilter) return false
      if (catFilter && t.product_category !== catFilter) return false
      if (query) {
        const q = query.toLowerCase()
        if (!t.product_name.toLowerCase().includes(q) &&
            !t.product_name_en.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [transactions, selectedMonth, typeFilter, catFilter, query])

  // 日別グループ
  const byDay = useMemo(() => {
    const map = new Map<string, TxRow[]>()
    filtered.forEach(t => {
      const dk = dayKey(t.created_at)
      if (!map.has(dk)) map.set(dk, [])
      map.get(dk)!.push(t)
    })
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filtered])

  return (
    <div className="space-y-5">

      {/* 月タブ */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {months.map(m => (
          <button
            key={m}
            onClick={() => setActiveMonth(m)}
            className="shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: m === selectedMonth ? 'var(--bg-dark)' : 'var(--bg-surface)',
              color:      m === selectedMonth ? 'var(--text-invert)' : 'var(--text-secondary)',
              border:     m === selectedMonth ? 'none' : '1px solid var(--border)',
            }}
          >
            {monthLabel(m)}
          </button>
        ))}
      </div>

      {/* 月サマリー */}
      {selectedMonth && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: '入庫',     value: `${monthlySummary.inCount} 件`,  sub: '今月の入庫回数' },
            { label: '出庫',     value: `${monthlySummary.outCount} 件`, sub: '今月の出庫回数' },
            { label: '調整',     value: `${monthlySummary.adjCount} 件`, sub: '今月の調整回数' },
            { label: '仕入れ総額', value: monthlySummary.inCost > 0 ? `¥${monthlySummary.inCost.toLocaleString()}` : '—', sub: '入庫コスト合計' },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-2xl p-4 space-y-1"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
              <p className="text-xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* カテゴリフィルター */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setCat(null)}
          className="h-9 px-3 rounded-xl text-xs font-medium transition-all"
          style={{
            background: catFilter === null ? 'var(--bg-dark)' : 'var(--bg-surface)',
            color:      catFilter === null ? 'var(--text-invert)' : 'var(--text-secondary)',
            border:     catFilter === null ? 'none' : '1px solid var(--border)',
          }}
        >
          すべて
        </button>
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setCat(c === catFilter ? null : c)}
            className="h-9 px-3 rounded-xl text-xs font-medium transition-all"
            style={{
              background: catFilter === c ? 'var(--bg-dark)' : 'var(--bg-surface)',
              color:      catFilter === c ? 'var(--text-invert)' : 'var(--text-secondary)',
              border:     catFilter === c ? 'none' : '1px solid var(--border)',
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* フィルターバー */}
      <div className="flex items-center gap-3 flex-wrap">
        <div
          className="flex items-center gap-2 px-3 h-9 rounded-xl flex-1 min-w-40"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <RiSearchLine size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="商品名で絞り込み..."
            className="flex-1 text-sm bg-transparent outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
        {(['in', 'out', 'adjustment'] as const).map(type => (
          <button
            key={type}
            onClick={() => setTypeFilter(typeFilter === type ? null : type)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-medium transition-all"
            style={{
              background: typeFilter === type ? 'var(--bg-dark)' : 'var(--bg-surface)',
              color:      typeFilter === type ? 'var(--text-invert)' : 'var(--text-secondary)',
              border:     typeFilter === type ? 'none' : '1px solid var(--border)',
            }}
          >
            {TYPE_ICON[type]}
            {TYPE_LABEL[type]}
          </button>
        ))}

        {/* ダウンロード */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => selectedMonth && downloadCSV(
              transactions.filter(t => monthKey(t.created_at) === selectedMonth),
              selectedMonth,
            )}
            disabled={!selectedMonth}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-medium transition-all disabled:opacity-40"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            <RiDownloadLine size={13} />
            CSV
          </button>
          <a
            href={selectedMonth ? `/api/stock/history/pdf?month=${selectedMonth}` : '#'}
            download
            onClick={e => { if (!selectedMonth) e.preventDefault() }}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-medium transition-all"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)', textDecoration: 'none' }}
          >
            <RiFilePdfLine size={13} />
            PDF
          </a>
        </div>
      </div>

      {/* 日別グループ */}
      {byDay.length === 0 ? (
        <div
          className="flex items-center justify-center py-20 rounded-2xl"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>該当するデータがありません</p>
        </div>
      ) : (
        <div className="space-y-4">
          {byDay.map(([dk, txs]) => {
            const dayCost = txs
              .filter(t => t.type === 'in' && t.cost_price != null)
              .reduce((s, t) => s + (t.cost_price ?? 0) * t.quantity, 0)

            return (
              <div
                key={dk}
                className="rounded-2xl overflow-hidden"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
              >
                {/* 日付ヘッダー */}
                <div
                  className="flex items-center justify-between px-4 py-2.5"
                  style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}
                >
                  <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    {formatJpDate(txs[0].created_at)}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {txs.length} 件
                    </span>
                    {dayCost > 0 && (
                      <span className="text-[11px] font-semibold tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                        仕入 ¥{dayCost.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* トランザクション行 */}
                <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <tbody>
                    {txs.map((t, i) => (
                      <tr
                        key={t.id}
                        className="transition-colors hover:bg-[var(--bg-base)]"
                        style={{ borderBottom: i < txs.length - 1 ? '1px solid var(--border)' : 'none' }}
                      >
                        {/* 時刻 */}
                        <td className="pl-4 pr-3 py-3 w-14 shrink-0">
                          <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
                            {formatTime(t.created_at)}
                          </span>
                        </td>

                        {/* 種別バッジ */}
                        <td className="px-2 py-3 w-16">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold"
                            style={TYPE_COLOR[t.type]}
                          >
                            {TYPE_ICON[t.type]}
                            {TYPE_LABEL[t.type]}
                          </span>
                        </td>

                        {/* 商品名 */}
                        <td className="px-3 py-3">
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {t.product_name}
                          </p>
                          {t.product_name_en && (
                            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                              {t.product_name_en}
                            </p>
                          )}
                        </td>

                        {/* 数量 */}
                        <td className="px-3 py-3 w-24 text-right">
                          <span
                            className="text-sm font-bold tabular-nums"
                            style={{
                              color: t.type === 'in' ? '#22c55e'
                                   : t.type === 'out' ? '#f87171'
                                   : 'var(--text-muted)',
                            }}
                          >
                            {t.type === 'in' ? '+' : t.type === 'out' ? '−' : ''}
                            {t.quantity} {t.unit}
                          </span>
                        </td>

                        {/* 仕入価格 */}
                        <td className="px-3 py-3 w-32 text-right">
                          {t.type === 'in' && t.cost_price != null ? (
                            <div>
                              <p className="text-xs tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                                ¥{t.cost_price.toLocaleString()}/本
                              </p>
                              <p className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                                計 ¥{(t.cost_price * t.quantity).toLocaleString()}
                              </p>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>

                        {/* メモ */}
                        <td className="px-4 py-3">
                          {t.notes && (
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {t.notes}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
