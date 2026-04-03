'use client'

import { useState, useMemo, useTransition } from 'react'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import {
  RiAddLine, RiGlassesFill, RiDeleteBinLine,
  RiSearchLine, RiArrowLeftLine, RiAlertFill,
  RiEditLine, RiCloseLine,
} from 'react-icons/ri'
import {
  createGlass,
  updateGlass,
  deleteGlass,
  toggleGlassAvailability,
  stockOutGlass,
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
  const [stockMap, setStockMap] = useState<Record<string, number>>(() =>
    Object.fromEntries(products.map(p => [p.id, p.stock]))
  )
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

  /* ── 編集 ── */
  const [editingId,    setEditingId]    = useState<string | null>(null)
  const [editServing,  setEditServing]  = useState('')
  const [editBottle,   setEditBottle]   = useState('')
  const [editPrice,    setEditPrice]    = useState('')
  const [editOpenedAt, setEditOpenedAt] = useState('')

  /* ── 派生値 ── */

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (p.stock <= 0) return false
      if (!query.trim()) return true
      const q = query.toLowerCase()
      return (
        p.name.toLowerCase().includes(q) ||
        (p.name_en ?? '').toLowerCase().includes(q) ||
        (p.category ?? '').toLowerCase().includes(q)
      )
    })
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

  function startEdit(g: GlassRow) {
    if (editingId === g.id) { setEditingId(null); return }
    setEditingId(g.id)
    setEditServing(g.serving_ml.toString())
    setEditBottle(g.bottle_ml?.toString() ?? '')
    setEditPrice(g.selling_price?.toString() ?? '')
    setEditOpenedAt(g.opened_at.slice(0, 10))
  }

  function handleSaveEdit(id: string) {
    const serving = parseFloat(editServing)
    if (!serving || serving <= 0) return
    startTransition(async () => {
      const res = await updateGlass(id, {
        serving_ml:    serving,
        bottle_ml:     editBottle ? parseFloat(editBottle) : null,
        selling_price: editPrice  ? parseFloat(editPrice)  : null,
        opened_at:     new Date(editOpenedAt).toISOString(),
      })
      if (!res.error) {
        setGlasses(prev => prev.map(g => g.id === id ? {
          ...g,
          serving_ml:    serving,
          bottle_ml:     editBottle ? parseFloat(editBottle) : null,
          selling_price: editPrice  ? parseFloat(editPrice)  : null,
          opened_at:     new Date(editOpenedAt).toISOString(),
        } : g))
        setEditingId(null)
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

  function handleStockOut(glassId: string, productId: string) {
    const openedAt = new Date().toISOString()
    setStockMap(prev => ({ ...prev, [productId]: (prev[productId] ?? 0) - 1 }))
    setGlasses(prev => prev.map(g => g.id === glassId ? { ...g, opened_at: openedAt } : g))
    startTransition(async () => {
      await stockOutGlass(glassId, productId)
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
            style={{ background: 'rgba(129,236,255,0.12)', color: '#81ecff', border: '1px solid rgba(129,236,255,0.3)' }}
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
          className="glass-stepper rounded-2xl overflow-hidden"
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
                  className="glass-bottle-list overflow-y-auto"
                  style={{ maxHeight: 280, borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}
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
                              style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-primary)' }}
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
                          ? { background: 'rgba(129,236,255,0.12)', color: '#81ecff', border: '1px solid rgba(129,236,255,0.3)' }
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
                  style={{ background: 'rgba(129,236,255,0.12)', color: '#81ecff', border: '1px solid rgba(129,236,255,0.3)' }}
                >
                  次へ
                </button>
              ) : (
                <button
                  onClick={handleRegister}
                  disabled={isPending}
                  className="px-6 h-9 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                  style={{ background: 'rgba(129,236,255,0.12)', color: '#81ecff', border: '1px solid rgba(129,236,255,0.3)' }}
                >
                  {isPending ? '登録中...' : '登録する'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ━━━ グラス一覧 ━━━ */}
      {glasses.length === 0 ? (
        <div
          className="rounded-2xl flex flex-col items-center justify-center py-20 gap-3"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <RiGlassesFill size={32} style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>グラス提供がまだありません</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 [&>*]:min-w-0">
          {glasses.map(g => {
            const cPerGlass = g.cost_price && g.bottle_ml
              ? (g.cost_price / g.bottle_ml) * g.serving_ml
              : null
            const rate = cPerGlass && g.selling_price
              ? (cPerGlass / g.selling_price) * 100
              : null
            const days  = daysSince(g.opened_at)
            const wine  = isWine(g.category_name)
            const alert = wine && days > 3

            return (
              <div
                key={g.id}
                className="rounded-2xl p-4 flex flex-col gap-3 overflow-hidden min-w-0"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
              >
                {/* 上段: アイコン + 商品名 + 操作ボタン */}
                <div className="flex items-start gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: alert ? '#fef2f2' : 'var(--bg-base)' }}
                  >
                    <RiGlassesFill size={15} style={{ color: alert ? '#ef4444' : 'var(--text-muted)' }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color: g.is_available ? 'var(--text-primary)' : 'var(--text-muted)' }}
                    >
                      {g.product_name}
                    </p>
                    {g.category_name && (
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{g.category_name}</p>
                    )}
                  </div>

                  {/* 編集・削除 */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => startEdit(g)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--bg-base)]"
                      style={{ color: editingId === g.id ? 'var(--text-primary)' : 'var(--text-muted)' }}
                    >
                      {editingId === g.id ? <RiCloseLine size={15} /> : <RiEditLine size={14} />}
                    </button>
                    <button
                      onClick={() => handleDelete(g.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--bg-base)]"
                      style={{ color: '#ef4444' }}
                    >
                      <RiDeleteBinLine size={14} />
                    </button>
                  </div>
                </div>

                {/* アラートバッジ */}
                {alert && (
                  <span
                    className="self-start flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' }}
                  >
                    <RiAlertFill size={10} />
                    開栓から{Math.floor(days)}日経過
                  </span>
                )}

                {/* 中段: スペック情報 */}
                <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                  <p className="text-[11px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    {g.serving_ml}ml / 杯{g.bottle_ml ? ` · 1本 ${g.bottle_ml}ml` : ''}
                  </p>
                  <p className="text-[11px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    開栓: {new Date(g.opened_at).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                  </p>
                </div>

                {/* 価格・原価率 */}
                <div className="flex items-baseline gap-3">
                  {g.selling_price != null && (
                    <p className="text-base font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
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

                {/* 下段: 提供トグル + 追加出庫 */}
                <div className="flex items-center gap-2 mt-auto pt-1" style={{ borderTop: '1px solid var(--border)' }}>
                  <button
                    onClick={() => handleToggle(g.id, !g.is_available)}
                    className="px-3 h-8 text-xs font-semibold rounded-xl transition-opacity hover:opacity-80 whitespace-nowrap"
                    style={g.is_available
                      ? { background: '#22c55e22', color: '#16a34a' }
                      : { background: 'var(--bg-base)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                    }
                  >
                    {g.is_available ? '提供中' : '停止中'}
                  </button>

                  {(stockMap[g.product_id] ?? 0) > 0 && (
                    <button
                      onClick={() => handleStockOut(g.id, g.product_id)}
                      disabled={isPending}
                      className="ml-auto px-4 h-10 text-sm font-semibold rounded-xl transition-opacity hover:opacity-80 disabled:opacity-40 whitespace-nowrap"
                      style={{ background: '#102937', color: '#ededed' }}
                    >
                      追加出庫 ({stockMap[g.product_id]}本)
                    </button>
                  )}
                </div>

                {/* 編集パネル */}
                {editingId === g.id && (
                  <div className="glass-stepper pt-3 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>提供量 (ml)</label>
                        <input type="number" min="1" value={editServing} onChange={e => setEditServing(e.target.value)}
                          className="w-full px-3 h-9 text-sm rounded-xl outline-none tabular-nums" style={fieldBase} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>ボトル容量 (ml)</label>
                        <input type="number" min="1" value={editBottle} onChange={e => setEditBottle(e.target.value)}
                          placeholder="例: 700" className="w-full px-3 h-9 text-sm rounded-xl outline-none tabular-nums" style={fieldBase} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>販売価格</label>
                        <div className="flex items-center gap-1">
                          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>¥</span>
                          <input type="number" min="0" value={editPrice} onChange={e => setEditPrice(e.target.value)}
                            className="w-full px-3 h-9 text-sm rounded-xl outline-none tabular-nums" style={fieldBase} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>開栓日</label>
                        <input type="date" value={editOpenedAt} onChange={e => setEditOpenedAt(e.target.value)}
                          className="w-full px-3 h-9 text-sm rounded-xl outline-none" style={fieldBase} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => setEditingId(null)}
                        className="px-4 h-8 text-sm rounded-xl transition-opacity hover:opacity-70"
                        style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                        キャンセル
                      </button>
                      <button onClick={() => handleSaveEdit(g.id)} disabled={isPending}
                        className="px-5 h-8 text-sm font-semibold rounded-xl transition-opacity hover:opacity-80 disabled:opacity-40"
                        style={{ background: 'rgba(129,236,255,0.12)', color: '#81ecff', border: '1px solid rgba(129,236,255,0.3)' }}>
                        {isPending ? '保存中...' : '保存'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
