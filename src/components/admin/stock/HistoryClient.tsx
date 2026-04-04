'use client'

import { useState, useMemo } from 'react'
import {
  RiAddBoxFill,
  RiSubtractFill,
  RiEqualizerFill,
  RiSearchLine,
  RiDownloadLine,
  RiDeleteBinFill,
  RiLockFill,
  RiCloseFill,
  RiArrowDownSLine,
} from 'react-icons/ri'
import { deleteStockTransaction, deleteMonthTransactions } from '@/app/admin/(protected)/stock/actions'

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
  in:         <RiAddBoxFill    size={10} />,
  out:        <RiSubtractFill  size={10} />,
  adjustment: <RiEqualizerFill size={10} />,
}
const TYPE_COLOR = {
  in:         { bg: 'rgba(129,236,255,0.12)',  color: '#81ecff' },
  out:        { bg: 'var(--bg-base)',  color: 'var(--text-secondary)', border: '1px solid var(--border)' },
  adjustment: { bg: 'var(--bg-base)',  color: 'var(--text-muted)',     border: '1px solid var(--border)' },
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
function dayKey(iso: string) { return iso.slice(0, 10) }

function downloadCSV(transactions: TxRow[], month: string | null) {
  const label = month ? month.replace('-', '-') : 'all'
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
  a.download = `stock-history-${label}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/* ── セレクトボックス共通ラッパー */
function SelectBox({ value, onChange, children }: {
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full h-10 pl-3 pr-8 rounded-xl text-sm outline-none appearance-none"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
        }}
      >
        {children}
      </select>
      <RiArrowDownSLine
        size={15}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: 'var(--text-muted)' }}
      />
    </div>
  )
}

export function HistoryClient({ transactions: initial }: { transactions: TxRow[] }) {
  const [rows,       setRows]      = useState<TxRow[]>(initial)
  const [query,      setQuery]     = useState('')
  const [typeFilter, setTypeFilter] = useState('')           // '' | 'in' | 'out' | 'adjustment'
  const [catFilter,  setCatFilter]  = useState('')           // '' | カテゴリ名
  const [rawPeriod,  setRawPeriod]  = useState<string>('')  // '' = 最新月, 'all' = 全期間, 'YYYY-MM' = 特定月

  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deleting,  setDeleting]  = useState(false)

  const [bulkOpen,  setBulkOpen]  = useState(false)
  const [bulkPw,    setBulkPw]    = useState('')
  const [bulkError, setBulkError] = useState<string | null>(null)
  const [bulkBusy,  setBulkBusy]  = useState(false)

  // 存在する月一覧（降順）
  const allMonths = useMemo(() => {
    const seen = new Set<string>()
    rows.forEach(t => seen.add(monthKey(t.created_at)))
    return Array.from(seen).sort().reverse()
  }, [rows])

  // 選択中の月（null = 全期間）
  const selectedMonth = useMemo<string | null>(() => {
    if (rawPeriod === 'all') return null
    if (rawPeriod && allMonths.includes(rawPeriod)) return rawPeriod
    return allMonths[0] ?? null
  }, [rawPeriod, allMonths])

  const categories = useMemo(() => {
    const seen = new Set<string>()
    return rows
      .map(t => t.product_category)
      .filter((c): c is string => !!c && !seen.has(c) && !!seen.add(c))
      .sort()
  }, [rows])

  // サマリー（全期間 or 選択月）
  const summary = useMemo(() => {
    const txs = selectedMonth
      ? rows.filter(t => monthKey(t.created_at) === selectedMonth)
      : rows
    return {
      inCount:  txs.filter(t => t.type === 'in').length,
      outCount: txs.filter(t => t.type === 'out').length,
      adjCount: txs.filter(t => t.type === 'adjustment').length,
      inCost:   txs.filter(t => t.type === 'in' && t.cost_price != null)
                   .reduce((s, t) => s + (t.cost_price ?? 0) * t.quantity, 0),
    }
  }, [rows, selectedMonth])

  const filtered = useMemo(() => {
    return rows.filter(t => {
      if (selectedMonth && monthKey(t.created_at) !== selectedMonth) return false
      if (typeFilter && t.type !== typeFilter) return false
      if (catFilter && t.product_category !== catFilter) return false
      if (query) {
        const q = query.toLowerCase()
        if (!t.product_name.toLowerCase().includes(q) &&
            !t.product_name_en.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [rows, selectedMonth, typeFilter, catFilter, query])

  const byDay = useMemo(() => {
    const map = new Map<string, TxRow[]>()
    filtered.forEach(t => {
      const dk = dayKey(t.created_at)
      if (!map.has(dk)) map.set(dk, [])
      map.get(dk)!.push(t)
    })
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filtered])

  async function handleDelete() {
    if (!confirmId || deleting) return
    setDeleting(true)
    try {
      await deleteStockTransaction(confirmId)
      setRows(prev => prev.filter(r => r.id !== confirmId))
    } finally {
      setDeleting(false)
      setConfirmId(null)
    }
  }

  async function handleBulkDelete() {
    if (!selectedMonth || bulkBusy) return
    setBulkBusy(true)
    setBulkError(null)
    try {
      const result = await deleteMonthTransactions(selectedMonth, bulkPw)
      if (result?.error) { setBulkError(result.error); return }
      setRows(prev => prev.filter(r => monthKey(r.created_at) !== selectedMonth))
      setBulkOpen(false)
      setBulkPw('')
    } catch {
      setBulkError('エラーが発生しました')
    } finally {
      setBulkBusy(false)
    }
  }

  const periodSelectValue = rawPeriod === 'all' ? 'all' : (selectedMonth ?? '')
  const summarySubLabel   = selectedMonth ? '今月' : '全期間'

  return (
    <div className="space-y-4">

      {/* ── 1. サマリーカード */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '入庫',      value: `${summary.inCount} 件`,  sub: `${summarySubLabel}の入庫回数` },
          { label: '出庫',      value: `${summary.outCount} 件`, sub: `${summarySubLabel}の出庫回数` },
          { label: '調整',      value: `${summary.adjCount} 件`, sub: `${summarySubLabel}の調整回数` },
          { label: '仕入れ総額', value: summary.inCost > 0 ? `¥${summary.inCost.toLocaleString()}` : '—', sub: '入庫コスト合計' },
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

      {/* ── 2. 検索フォーム（1カラム） */}
      <div
        className="flex items-center gap-2 px-3 h-10 rounded-xl"
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

      {/* ── 3. 絞り込みドロップダウン（スマホ 2カラム） */}
      <div className="grid grid-cols-2 gap-3">
        {/* 期間 */}
        <SelectBox
          value={periodSelectValue}
          onChange={v => setRawPeriod(v)}
        >
          <option value="all">全期間</option>
          {allMonths.map(m => (
            <option key={m} value={m}>{monthLabel(m)}</option>
          ))}
        </SelectBox>

        {/* 種別 */}
        <SelectBox value={typeFilter} onChange={setTypeFilter}>
          <option value="">すべて</option>
          <option value="in">入庫</option>
          <option value="out">出庫</option>
          <option value="adjustment">調整</option>
        </SelectBox>
      </div>

      {/* ── 4. カテゴリドロップダウン（1カラム） */}
      <SelectBox value={catFilter} onChange={setCatFilter}>
        <option value="">すべてのカテゴリ</option>
        {categories.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </SelectBox>

      {/* ── 5. CSV / 一括削除 */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => downloadCSV(
            selectedMonth
              ? rows.filter(t => monthKey(t.created_at) === selectedMonth)
              : rows,
            selectedMonth,
          )}
          className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-medium transition-all"
          style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
        >
          <RiDownloadLine size={13} />
          CSV↓
        </button>
        <button
          onClick={() => { setBulkPw(''); setBulkError(null); setBulkOpen(true) }}
          disabled={!selectedMonth}
          className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-medium transition-all disabled:opacity-40"
          style={{ background: 'var(--bg-surface)', color: '#d84f2a', border: '1px solid #d84f2a33' }}
        >
          <RiDeleteBinFill size={13} />
          一括削除
        </button>
      </div>

      {/* ── 6. 日別グループ */}
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

                {/* トランザクションカード */}
                <div className="flex flex-col gap-2 px-4 py-3">
                  {txs.map(t => {
                    const tc = TYPE_COLOR[t.type]
                    return (
                      <div
                        key={t.id}
                        className="group flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
                        style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}
                      >
                        {/* 左: 3段テキスト */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">

                          {/* 1段目: 種別タグ + 時刻 */}
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold shrink-0"
                              style={{ background: tc.bg, color: tc.color, border: (tc as { border?: string }).border }}
                            >
                              {TYPE_ICON[t.type]}
                              {TYPE_LABEL[t.type]}
                            </span>
                            <span className="text-[11px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                              {formatTime(t.created_at)}
                            </span>
                          </div>

                          {/* 2段目: 商品名 */}
                          <p className="text-sm font-semibold leading-snug truncate" style={{ color: 'var(--text-primary)' }}>
                            {t.product_name}
                          </p>

                          {/* 3段目: 備考 + 金額 */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {t.notes && (
                              <span className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                                {t.notes}
                              </span>
                            )}
                            {t.type === 'in' && t.cost_price != null && (
                              <span className="text-[11px] tabular-nums shrink-0" style={{ color: 'var(--text-secondary)' }}>
                                ¥{t.cost_price.toLocaleString()}/本
                                <span className="ml-1" style={{ color: 'var(--text-muted)' }}>
                                  計¥{(t.cost_price * t.quantity).toLocaleString()}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 右: 本数 + 削除 */}
                        <div className="flex flex-col items-end justify-center gap-1 shrink-0">
                          <span
                            className="text-lg font-bold tabular-nums leading-none"
                            style={{
                              color: t.type === 'in' ? 'var(--success)'
                                   : t.type === 'out' ? 'var(--danger)'
                                   : 'var(--text-muted)',
                            }}
                          >
                            {t.type === 'in' ? '+' : t.type === 'out' ? '−' : ''}
                            {t.quantity}
                          </span>
                          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            {t.unit}
                          </span>
                          <button
                            onClick={() => setConfirmId(t.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg transition-all hover:bg-[rgba(255,113,108,0.15)]"
                            style={{ color: 'var(--text-muted)' }}
                            title="削除"
                          >
                            <RiDeleteBinFill size={12} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 個別削除 確認モーダル */}
      {confirmId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={() => !deleting && setConfirmId(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-5 space-y-2">
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>履歴を削除しますか？</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>この操作は取り消せません。</p>
            </div>
            <div className="flex gap-3 px-6 py-4" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => setConfirmId(null)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-70 disabled:opacity-40"
                style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ background: '#d84f2a', color: '#fff' }}
              >
                {deleting ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 一括削除モーダル */}
      {bulkOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={() => !bulkBusy && setBulkOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2">
                <RiLockFill size={14} style={{ color: '#d84f2a' }} />
                <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                  {selectedMonth ? monthLabel(selectedMonth) : ''} の履歴を一括削除
                </p>
              </div>
              <button
                onClick={() => setBulkOpen(false)}
                disabled={bulkBusy}
                className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-base)]"
                style={{ color: 'var(--text-muted)' }}
              >
                <RiCloseFill size={17} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                選択中の月の入出庫履歴をすべて削除します。この操作は取り消せません。
              </p>
              <div>
                <p className="text-[11px] mb-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>管理パスワード</p>
                <input
                  type="password"
                  value={bulkPw}
                  onChange={e => { setBulkPw(e.target.value); setBulkError(null) }}
                  onKeyDown={e => e.key === 'Enter' && handleBulkDelete()}
                  placeholder="パスワードを入力..."
                  className="w-full px-3 py-2.5 text-sm outline-none rounded-xl"
                  style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  autoFocus
                />
                {bulkError && (
                  <p className="text-[11px] mt-1.5" style={{ color: '#d84f2a' }}>{bulkError}</p>
                )}
              </div>
            </div>
            <div className="flex gap-3 px-5 py-4" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => setBulkOpen(false)}
                disabled={bulkBusy}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-70 disabled:opacity-40"
                style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
              >
                キャンセル
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkBusy || !bulkPw}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ background: '#d84f2a', color: '#fff' }}
              >
                {bulkBusy ? '削除中...' : '一括削除する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
