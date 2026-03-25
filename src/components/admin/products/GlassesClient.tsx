'use client'

import { useState, useMemo, useTransition } from 'react'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import {
  RiAddLine, RiGlassesFill, RiDeleteBinLine,
  RiSearchLine, RiArrowLeftLine, RiAlertFill,
} from 'react-icons/ri'
import {
  createGlass,
  deleteGlass,
  toggleGlassAvailability,
} from '@/app/admin/(protected)/products/glass-actions'

/* ── 型定義 ──────────────────────────────────────────────── */

export type GlassRow = {
  id:              string
  product_id:      string
  product_name:    string
  product_name_en: string
  cost_price:      number | null
  serving_ml:      number
  bottle_ml:       number | null
  selling_price:   number | null
  opened_at:       string
  is_available:    boolean
  category_name:   string | null
}

export type ProductOption = {
  id:        string
  name:      string
  name_en:   string
  cost_price: number | null
  stock:      number
  volume_ml:  number | null
  category:   string | null
}

/* ── 定数 ────────────────────────────────────────────────── */

const SERVING_PRESETS = [30, 45, 60, 90, 120, 150, 180]

const STEP_LABELS = ['ボトル選択', '提供量', '価格・開栓日']

const STEPPER_SX = {
  p: 0,
  '& .MuiStepIcon-root':            { color: '#ccc6bf', width: 28, height: 28 },
  '& .MuiStepIcon-root.Mui-active': { color: '#091d26' },
  '& .MuiStepIcon-root.Mui-completed': { color: '#091d26' },
  '& .MuiStepIcon-text':            { fontSize: '0.65rem', fontWeight: 700 },
  '& .MuiStepLabel-label': {
    fontFamily: 'inherit',
    fontSize: '11px',
    marginTop: '4px',
    color: '#6b9fa5',
  },
  '& .MuiStepLabel-label.Mui-active':    { color: '#091d26', fontWeight: 700 },
  '& .MuiStepLabel-label.Mui-completed': { color: '#091d26' },
  '& .MuiStepConnector-line': { borderColor: '#ccc6bf' },
} as const

/* ── ユーティリティ ──────────────────────────────────────── */

function isWine(categoryName: string | null): boolean {
  return !!categoryName && /wine|ワイン|ワイン/i.test(categoryName)
}

function daysSince(isoStr: string): number {
  return (Date.now() - new Date(isoStr).getTime()) / 86_400_000
}

function todayLocalISO(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/* ── メインコンポーネント ────────────────────────────────── */

export function GlassesClient({
  glasses: init,
  products,
}: {
  glasses: GlassRow[]
  products: ProductOption[]
}) {
  const [glasses, setGlasses]   = useState(init)
  const [showForm, setShowForm] = useState(false)
  const [step, setStep]         = useState(0)

  /* step 1 */
  const [query, setQuery]       = useState('')
  const [selected, setSelected] = useState<ProductOption | null>(null)

  /* step 2 */
  const [servingPreset, setServingPreset] = useState<number | null>(null)
  const [customServing, setCustomServing] = useState('')
  const [bottleMl, setBottleMl]           = useState('')

  /* step 3 */
  const [sellingPrice, setSellingPrice] = useState('')
  const [openedAt, setOpenedAt]         = useState(todayLocalISO())

  const [isPending, startTransition] = useTransition()

  /* ── 派生値 ── */

  const filteredProducts = useMemo(() => {
    if (!query.trim()) return products
    const q = query.toLowerCase()
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.name_en ?? '').toLowerCase().includes(q) ||
      (p.category ?? '').toLowerCase().includes(q),
    )
  }, [products, query])

  const effectiveServingMl = servingPreset ?? (customServing ? parseFloat(customServing) : null)

  const effectiveBottleMl = bottleMl
    ? parseFloat(bottleMl)
    : (selected?.volume_ml ?? null)

  const costPerGlass = useMemo(() => {
    if (!selected?.cost_price || !effectiveServingMl || !effectiveBottleMl) return null
    return (selected.cost_price / effectiveBottleMl) * effectiveServingMl
  }, [selected, effectiveServingMl, effectiveBottleMl])

  const costRate = useMemo(() => {
    if (!costPerGlass || !sellingPrice) return null
    const p = parseFloat(sellingPrice)
    if (!p || p <= 0) return null
    return (costPerGlass / p) * 100
  }, [costPerGlass, sellingPrice])

  const canNext1 = !!selected
  const canNext2 = !!effectiveServingMl && effectiveServingMl > 0

  /* ── ハンドラ ── */

  function resetForm() {
    setStep(0); setQuery(''); setSelected(null)
    setServingPreset(null); setCustomServing(''); setBottleMl('')
    setSellingPrice(''); setOpenedAt(todayLocalISO())
    setShowForm(false)
  }

  function handleRegister() {
    if (!selected || !effectiveServingMl) return
    startTransition(async () => {
      const result = await createGlass({
        product_id:    selected.id,
        serving_ml:    effectiveServingMl,
        bottle_ml:     effectiveBottleMl,
        selling_price: sellingPrice ? parseFloat(sellingPrice) : null,
        opened_at:     new Date(openedAt).toISOString(),
        is_available:  true,
      })
      if (result.data) {
        setGlasses(prev => [result.data!, ...prev])
        resetForm()
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('このグラス提供を削除しますか？\n（在庫は自動で戻りません）')) return
    startTransition(async () => {
      await deleteGlass(id)
      setGlasses(prev => prev.filter(g => g.id !== id))
    })
  }

  function handleToggle(id: string, val: boolean) {
    startTransition(async () => {
      await toggleGlassAvailability(id, val)
      setGlasses(prev => prev.map(g => g.id === id ? { ...g, is_available: val } : g))
    })
  }

  /* ── 共通スタイル ── */

  const fieldBase = {
    background: 'var(--bg-base)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
  } as const

  /* ── レンダリング ── */

  return (
    <div className="max-w-5xl space-y-6">

      {/* ヘッダー */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>グラス管理</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{glasses.length} 件</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 h-10 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 flex-shrink-0"
            style={{ background: 'var(--bg-dark)', color: 'var(--text-invert)' }}
          >
            <RiAddLine size={16} />
            <span className="hidden sm:inline">グラスを追加</span>
            <span className="sm:hidden">追加</span>
          </button>
        )}
      </div>

      {/* ━━━ Stepperフォーム ━━━ */}
      {showForm && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          {/* フォームヘッダー */}
          <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>グラスを追加</p>
              <button
                onClick={resetForm}
                className="text-xs px-3 h-7 rounded-lg transition-opacity hover:opacity-70"
                style={{ color: 'var(--text-muted)', background: 'var(--bg-base)', border: '1px solid var(--border)' }}
              >
                キャンセル
              </button>
            </div>

            {/* MUI Stepper */}
            <Stepper activeStep={step} alternativeLabel sx={STEPPER_SX}>
              {STEP_LABELS.map(label => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </div>

          {/* ステップコンテンツ */}
          <div className="p-5">

            {/* ────────── Step 1: ボトルを選んでください ────────── */}
            {step === 0 && (
              <div className="space-y-4">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  ボトルを選んでください
                </p>

                {/* 検索 */}
                <div
                  className="flex items-center gap-2 px-3 h-10 rounded-xl"
                  style={fieldBase}
                >
                  <RiSearchLine size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="商品名・カテゴリで検索..."
                    className="flex-1 text-sm bg-transparent outline-none"
                    style={{ color: 'var(--text-primary)' }}
                    autoFocus
                  />
                </div>

                {/* 商品リスト */}
                <div
                  className="rounded-xl overflow-hidden overflow-y-auto"
                  style={{ maxHeight: 280, border: '1px solid var(--border)' }}
                >
                  {filteredProducts.length === 0 ? (
                    <p className="text-sm text-center py-10" style={{ color: 'var(--text-muted)' }}>
                      商品が見つかりません
                    </p>
                  ) : (
                    filteredProducts.map((p, i) => {
                      const isActive = selected?.id === p.id
                      return (
                        <button
                          key={p.id}
                          onClick={() => setSelected(p)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                          style={{
                            borderBottom: i < filteredProducts.length - 1 ? '1px solid var(--border)' : undefined,
                            background: isActive ? 'var(--bg-dark)' : 'var(--bg-surface)',
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm font-medium truncate"
                              style={{ color: isActive ? 'var(--text-invert)' : 'var(--text-primary)' }}
                            >
                              {p.name}
                            </p>
                            {p.category && (
                              <p className="text-[11px] truncate" style={{ color: isActive ? '#9ab4bc' : 'var(--text-muted)' }}>
                                {p.category}
                              </p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0 space-y-0.5">
                            <p className="text-[11px] font-semibold tabular-nums" style={{ color: isActive ? '#9ab4bc' : 'var(--text-muted)' }}>
                              在庫 {p.stock}
                            </p>
                            {p.volume_ml && (
                              <p className="text-[10px] tabular-nums" style={{ color: isActive ? '#9ab4bc' : 'var(--text-muted)' }}>
                                {p.volume_ml}ml
                              </p>
                            )}
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            )}

            {/* ────────── Step 2: 提供量を選択してください ────────── */}
            {step === 1 && selected && (
              <div className="space-y-5">
                {/* 選択ボトル表示 */}
                <div
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}
                >
                  <RiGlassesFill size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <span className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{selected.name}</span>
                </div>

                {/* 提供量プリセット */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    提供量を選択してください
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SERVING_PRESETS.map(ml => (
                      <button
                        key={ml}
                        onClick={() => { setServingPreset(ml); setCustomServing('') }}
                        className="px-3.5 h-9 rounded-xl text-sm font-semibold transition-all"
                        style={servingPreset === ml
                          ? { background: 'var(--bg-dark)', color: 'var(--text-invert)' }
                          : { background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
                        }
                      >
                        {ml}ml
                      </button>
                    ))}
                  </div>

                  {/* カスタム */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>カスタム</span>
                    <input
                      type="number"
                      min="1"
                      value={customServing}
                      onChange={e => { setCustomServing(e.target.value); setServingPreset(null) }}
                      placeholder="ml"
                      className="w-20 px-3 h-9 text-sm rounded-xl outline-none tabular-nums"
                      style={fieldBase}
                    />
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>ml</span>
                  </div>
                </div>

                {/* ボトル容量 */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>ボトル容量</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={bottleMl !== '' ? bottleMl : (selected.volume_ml?.toString() ?? '')}
                      onChange={e => setBottleMl(e.target.value)}
                      placeholder="例: 700"
                      className="w-28 px-3 h-9 text-sm rounded-xl outline-none tabular-nums"
                      style={fieldBase}
                    />
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>ml</span>
                  </div>

                  {/* 1本あたり何杯 */}
                  {effectiveServingMl && effectiveBottleMl && (
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      1本あたり 約{' '}
                      <span className="font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                        {Math.floor(effectiveBottleMl / effectiveServingMl)}
                      </span>{' '}
                      杯
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ────────── Step 3: 価格・開栓日 ────────── */}
            {step === 2 && selected && (
              <div className="space-y-5">
                {/* サマリー */}
                <div className="flex flex-wrap gap-2">
                  <div className="px-3 py-2 rounded-xl text-sm" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>ボトル: </span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{selected.name}</span>
                  </div>
                  <div className="px-3 py-2 rounded-xl text-sm tabular-nums" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>提供量: </span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{effectiveServingMl}ml</span>
                  </div>
                </div>

                {/* 一杯あたり原価 */}
                {costPerGlass != null ? (
                  <div
                    className="flex items-stretch gap-0 rounded-xl overflow-hidden"
                    style={{ border: '1px solid var(--border)' }}
                  >
                    <div className="flex-1 px-4 py-3" style={{ background: 'var(--bg-base)' }}>
                      <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-muted)' }}>一杯あたり原価</p>
                      <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                        ¥{costPerGlass.toFixed(1)}
                      </p>
                    </div>
                    {effectiveBottleMl && (
                      <div className="px-4 py-3" style={{ background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)' }}>
                        <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-muted)' }}>ボトル原価</p>
                        <p className="text-sm font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                          ¥{(selected.cost_price ?? 0).toLocaleString()}
                        </p>
                        <p className="text-[11px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                          {effectiveBottleMl}ml
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs px-3 py-2 rounded-xl" style={{ background: 'var(--bg-base)', color: 'var(--text-muted)' }}>
                    ボトル容量または原価が未設定のため原価計算できません
                  </p>
                )}

                {/* 販売価格 */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    販売価格
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>¥</span>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={sellingPrice}
                      onChange={e => setSellingPrice(e.target.value)}
                      placeholder="例: 800"
                      className="w-36 px-3 h-10 text-sm rounded-xl outline-none tabular-nums"
                      style={fieldBase}
                      autoFocus
                    />
                  </div>

                  {/* 原価率バー */}
                  {costRate != null && (
                    <div className="flex items-center gap-3 mt-1">
                      <div
                        className="h-2 rounded-full overflow-hidden flex-1 max-w-36"
                        style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, costRate)}%`,
                            background: costRate > 50 ? '#ef4444' : costRate > 30 ? '#f59e0b' : '#22c55e',
                          }}
                        />
                      </div>
                      <p
                        className="text-sm font-bold tabular-nums"
                        style={{ color: costRate > 50 ? '#ef4444' : costRate > 30 ? '#f59e0b' : '#22c55e' }}
                      >
                        原価率 {costRate.toFixed(1)}%
                      </p>
                    </div>
                  )}
                </div>

                {/* 開栓日 */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    開栓日
                  </label>
                  <input
                    type="date"
                    value={openedAt}
                    onChange={e => setOpenedAt(e.target.value)}
                    className="px-3 h-10 text-sm rounded-xl outline-none"
                    style={fieldBase}
                  />
                </div>
              </div>
            )}

            {/* ナビゲーション */}
            <div
              className="flex items-center gap-2 mt-6 pt-4"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              {step > 0 && (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="flex items-center gap-1.5 px-4 h-9 rounded-xl text-sm font-semibold transition-opacity hover:opacity-70"
                  style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                >
                  <RiArrowLeftLine size={14} />
                  戻る
                </button>
              )}
              <div className="flex-1" />
              {step < 2 ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  disabled={step === 0 ? !canNext1 : !canNext2}
                  className="px-6 h-9 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                  style={{ background: 'var(--bg-dark)', color: 'var(--text-invert)' }}
                >
                  次へ
                </button>
              ) : (
                <button
                  onClick={handleRegister}
                  disabled={isPending}
                  className="px-6 h-9 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                  style={{ background: 'var(--bg-dark)', color: 'var(--text-invert)' }}
                >
                  {isPending ? '登録中...' : '登録する'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ━━━ グラス一覧 ━━━ */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        {glasses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RiGlassesFill size={32} style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>グラス提供がまだありません</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {glasses.map(g => {
              const cPerGlass = g.cost_price && g.bottle_ml
                ? (g.cost_price / g.bottle_ml) * g.serving_ml
                : null
              const rate = cPerGlass && g.selling_price
                ? (cPerGlass / g.selling_price) * 100
                : null
              const days   = daysSince(g.opened_at)
              const wine   = isWine(g.category_name)
              const alert  = wine && days > 3

              return (
                <div key={g.id} className="px-4 py-3 sm:px-5 sm:py-4">
                  <div className="flex items-start gap-3">
                    {/* アイコン */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: alert ? '#fef2f2' : 'var(--bg-base)' }}
                    >
                      <RiGlassesFill size={16} style={{ color: alert ? '#ef4444' : 'var(--text-muted)' }} />
                    </div>

                    {/* 商品情報 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p
                          className="text-sm font-semibold truncate"
                          style={{ color: g.is_available ? 'var(--text-primary)' : 'var(--text-muted)' }}
                        >
                          {g.product_name}
                        </p>

                        {/* ワインアラートバッジ */}
                        {alert && (
                          <span
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0"
                            style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' }}
                          >
                            <RiAlertFill size={10} />
                            開栓から{Math.floor(days)}日経過
                          </span>
                        )}
                      </div>

                      {/* サブ情報行 */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                        <p className="text-[11px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                          {g.serving_ml}ml / 杯
                          {g.bottle_ml ? ` · 1本 ${g.bottle_ml}ml` : ''}
                        </p>
                        <p className="text-[11px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                          開栓: {new Date(g.opened_at).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    {/* 右側: 価格・原価率・操作 */}
                    <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                      {/* 価格・原価率（sm以上） */}
                      <div className="text-right hidden sm:block">
                        {g.selling_price != null && (
                          <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                            ¥{g.selling_price.toLocaleString()}
                          </p>
                        )}
                        {rate != null && (
                          <p
                            className="text-[11px] tabular-nums"
                            style={{ color: rate > 50 ? '#ef4444' : rate > 30 ? '#f59e0b' : '#22c55e' }}
                          >
                            原価率 {rate.toFixed(1)}%
                          </p>
                        )}
                      </div>

                      {/* 提供トグル */}
                      <button
                        onClick={() => handleToggle(g.id, !g.is_available)}
                        className="px-2.5 h-6 text-[10px] font-semibold rounded-full transition-opacity hover:opacity-80 whitespace-nowrap"
                        style={g.is_available
                          ? { background: '#22c55e22', color: '#16a34a' }
                          : { background: 'var(--bg-base)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                        }
                      >
                        {g.is_available ? '提供中' : '停止中'}
                      </button>

                      {/* 削除 */}
                      <button
                        onClick={() => handleDelete(g.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--bg-base)]"
                        style={{ color: '#ef4444' }}
                        title="削除"
                      >
                        <RiDeleteBinLine size={14} />
                      </button>
                    </div>
                  </div>

                  {/* 価格・原価率（モバイル） */}
                  {(g.selling_price != null || rate != null) && (
                    <div className="flex items-center gap-3 mt-2 ml-12 sm:hidden">
                      {g.selling_price != null && (
                        <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                          ¥{g.selling_price.toLocaleString()}
                        </p>
                      )}
                      {rate != null && (
                        <p
                          className="text-[11px] tabular-nums"
                          style={{ color: rate > 50 ? '#ef4444' : rate > 30 ? '#f59e0b' : '#22c55e' }}
                        >
                          原価率 {rate.toFixed(1)}%
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
