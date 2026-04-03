'use client'

import { useState, useMemo, useTransition } from 'react'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import {
  RiAddLine, RiCupFill, RiEditLine, RiDeleteBinLine,
  RiSearchLine, RiArrowLeftLine, RiCheckLine, RiCloseLine,
  RiPriceTag3Fill, RiArrowDownSLine, RiAlertLine,
} from 'react-icons/ri'
import {
  createCocktailWithIngredients,
  updateCocktailBasicInfo,
  replaceIngredients,
  deleteCocktail,
  toggleCocktailAvailability,
} from '@/app/admin/(protected)/products/cocktail-actions'
import type { ProductOption } from './GlassesClient'

/* ── 型定義 ──────────────────────────────────────────────── */

export type CocktailIngredient = {
  id:           string
  product_id:   string
  product_name: string
  quantity:     number
  unit:         string
  cost_price:   number | null
  volume_ml:    number | null
  stock:        number
}

export type CocktailRow = {
  id:            string
  name:          string
  name_en:       string
  description:   string
  selling_price: number | null
  image_url:     string | null
  tags:          string[]
  is_available:  boolean
  sort_order:    number
  recipe_steps:  string[]
  ingredients:   CocktailIngredient[]
  total_cost:    number | null
  cost_rate_pct: number | null
}

type IngDraft = { product: ProductOption; quantity: string; unit: string }
type EditIng  = {
  product_id:   string
  product_name: string
  quantity:     string
  unit:         string
  cost_price:   number | null
  volume_ml:    number | null
  stock:        number
}

/* ── 定数 ────────────────────────────────────────────────── */

const STEP_LABELS  = ['材料選択', '使用量', '基本情報・価格']
const UNIT_OPTIONS = ['ml', 'cl', 'oz', 'dash', 'tsp', '個', 'g']
const ML_PER: Record<string, number> = { ml: 1, cl: 10, oz: 29.57, dash: 0.6, tsp: 5 }

const STEPPER_SX = {
  p: 0,
  '& .MuiStepIcon-root':               { color: '#ccc6bf', width: 28, height: 28 },
  '& .MuiStepIcon-root.Mui-active':    { color: '#091d26' },
  '& .MuiStepIcon-root.Mui-completed': { color: '#091d26' },
  '& .MuiStepIcon-text':               { fontSize: '0.65rem', fontWeight: 700 },
  '& .MuiStepLabel-label': { fontFamily: 'inherit', fontSize: '11px', marginTop: '4px', color: '#6b9fa5' },
  '& .MuiStepLabel-label.Mui-active':    { color: '#091d26', fontWeight: 700 },
  '& .MuiStepLabel-label.Mui-completed': { color: '#091d26' },
  '& .MuiStepConnector-line': { borderColor: '#ccc6bf' },
} as const

/* ── 原価計算 ────────────────────────────────────────────── */

function calcIngCost(qty: number, unit: string, cost: number | null, vol: number | null): number | null {
  if (!cost || qty <= 0) return null
  const f = ML_PER[unit]
  if (f !== undefined) return vol ? (cost / vol) * qty * f : null
  return cost * qty
}

function totalCost(ings: { qty: number; unit: string; cost_price: number | null; volume_ml: number | null }[]): number | null {
  let sum = 0
  for (const i of ings) {
    const c = calcIngCost(i.qty, i.unit, i.cost_price, i.volume_ml)
    if (c == null) return null
    sum += c
  }
  return sum
}

/* ── メインコンポーネント ────────────────────────────────── */

export function CocktailsClient({ cocktails: init, products }: { cocktails: CocktailRow[]; products: ProductOption[] }) {
  const [cocktails, setCocktails] = useState(init)
  const [isPending, startTransition] = useTransition()

  /* ── 展開 ── */
  const [expandedId,  setExpandedId]  = useState<string | null>(null)
  const [editingId,   setEditingId]   = useState<string | null>(null)

  /* ── Stepper ── */
  const [showForm,         setShowForm]         = useState(false)
  const [step,             setStep]             = useState(0)
  const [query,            setQuery]            = useState('')
  const [selectedProducts, setSelectedProducts] = useState<ProductOption[]>([])
  const [ingDrafts,        setIngDrafts]        = useState<IngDraft[]>([])
  const [recipeSteps,      setRecipeSteps]      = useState<string[]>([''])
  const [cocktailName,     setCocktailName]     = useState('')
  const [cocktailNameEn,   setCocktailNameEn]   = useState('')
  const [sellingPrice,     setSellingPrice]     = useState('')

  /* ── 編集 ── */
  const [editName,        setEditName]        = useState('')
  const [editNameEn,      setEditNameEn]      = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPrice,       setEditPrice]       = useState('')
  const [editTags,        setEditTags]        = useState('')
  const [editAvail,       setEditAvail]       = useState(true)
  const [editIngs,    setEditIngs]    = useState<EditIng[]>([])
  const [editSteps,   setEditSteps]   = useState<string[]>([''])
  const [addIngQuery, setAddIngQuery] = useState('')

  /* ── スタイル ── */
  const fieldBase = { background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' } as const

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

  const addIngResults = useMemo(() => {
    if (!addIngQuery.trim()) return []
    const q = addIngQuery.toLowerCase()
    return products.filter(p =>
      (p.name.toLowerCase().includes(q) || (p.name_en ?? '').toLowerCase().includes(q)) &&
      !editIngs.some(e => e.product_id === p.id),
    ).slice(0, 8)
  }, [products, addIngQuery, editIngs])

  const stepCostRows = useMemo(() => ingDrafts.map(d => ({
    name:  d.product.name,
    qty:   parseFloat(d.quantity) || 0,
    unit:  d.unit,
    cost:  calcIngCost(parseFloat(d.quantity) || 0, d.unit, d.product.cost_price, d.product.volume_ml),
  })), [ingDrafts])

  const stepTotal = useMemo(() => totalCost(
    ingDrafts.map(d => ({ qty: parseFloat(d.quantity) || 0, unit: d.unit, cost_price: d.product.cost_price, volume_ml: d.product.volume_ml }))
  ), [ingDrafts])

  const stepRate = useMemo(() => {
    const p = parseFloat(sellingPrice)
    return stepTotal && p > 0 ? (stepTotal / p) * 100 : null
  }, [stepTotal, sellingPrice])

  const canNext1 = selectedProducts.length > 0
  const canNext2 = ingDrafts.every(d => parseFloat(d.quantity) > 0) && ingDrafts.length > 0

  /* ── Stepper ── */
  function toggleProduct(p: ProductOption) {
    setSelectedProducts(prev =>
      prev.some(s => s.id === p.id) ? prev.filter(s => s.id !== p.id) : [...prev, p]
    )
  }

  function goStep2() {
    setIngDrafts(selectedProducts.map(p => ({ product: p, quantity: '', unit: 'ml' })))
    setStep(1)
  }

  function updateDraft(idx: number, f: 'quantity' | 'unit', v: string) {
    setIngDrafts(prev => prev.map((d, i) => i === idx ? { ...d, [f]: v } : d))
  }

  function resetForm() {
    setStep(0); setQuery(''); setSelectedProducts([]); setIngDrafts([])
    setRecipeSteps(['']); setCocktailName(''); setCocktailNameEn(''); setSellingPrice('')
    setShowForm(false)
  }

  function handleRegister() {
    if (!cocktailName.trim()) return
    const cleanSteps = recipeSteps.map(s => s.trim()).filter(Boolean)
    startTransition(async () => {
      const result = await createCocktailWithIngredients(
        { name: cocktailName, name_en: cocktailNameEn, description: '', selling_price: sellingPrice ? parseFloat(sellingPrice) : null, tags: [], is_available: true, recipe_steps: cleanSteps },
        ingDrafts.map(d => ({ product_id: d.product.id, quantity: parseFloat(d.quantity), unit: d.unit })),
      )
      if (result.data) {
        const ings: CocktailIngredient[] = ingDrafts.map((d, i) => ({
          id: `tmp-${i}`, product_id: d.product.id, product_name: d.product.name,
          quantity: parseFloat(d.quantity), unit: d.unit, cost_price: d.product.cost_price, volume_ml: d.product.volume_ml,
          stock: d.product.stock,
        }))
        setCocktails(prev => [{
          id: result.data!.id, name: cocktailName, name_en: cocktailNameEn, description: '',
          selling_price: sellingPrice ? parseFloat(sellingPrice) : null, image_url: null, tags: [],
          is_available: true, sort_order: 0, recipe_steps: cleanSteps, ingredients: ings,
          total_cost: stepTotal, cost_rate_pct: stepRate,
        }, ...prev])
        resetForm()
      }
    })
  }

  /* ── 編集 ── */
  function startEdit(c: CocktailRow) {
    if (editingId === c.id) { setEditingId(null); return }
    setEditingId(c.id); setExpandedId(null)
    setEditName(c.name); setEditNameEn(c.name_en)
    setEditDescription(c.description ?? '')
    setEditPrice(c.selling_price?.toString() ?? '')
    setEditTags(c.tags.join(', '))
    setEditAvail(c.is_available)
    setEditIngs(c.ingredients.map(i => ({ product_id: i.product_id, product_name: i.product_name, quantity: i.quantity.toString(), unit: i.unit, cost_price: i.cost_price, volume_ml: i.volume_ml, stock: i.stock })))
    setEditSteps(c.recipe_steps.length > 0 ? [...c.recipe_steps] : [''])
    setAddIngQuery('')
  }

  function updateEditIng(idx: number, f: 'quantity' | 'unit', v: string) {
    setEditIngs(prev => prev.map((e, i) => i === idx ? { ...e, [f]: v } : e))
  }

  function addIngToEdit(p: ProductOption) {
    setEditIngs(prev => [...prev, { product_id: p.id, product_name: p.name, quantity: '', unit: 'ml', cost_price: p.cost_price, volume_ml: p.volume_ml, stock: p.stock }])
    setAddIngQuery('')
  }

  function handleSaveEdit(id: string) {
    const cleanSteps = editSteps.map(s => s.trim()).filter(Boolean)
    startTransition(async () => {
      const [bRes, iRes] = await Promise.all([
        updateCocktailBasicInfo(id, { name: editName, name_en: editNameEn, description: editDescription, selling_price: editPrice ? parseFloat(editPrice) : null, tags: editTags ? editTags.split(',').map(t => t.trim()).filter(Boolean) : [], is_available: editAvail, recipe_steps: cleanSteps }),
        replaceIngredients(id, editIngs.map(e => ({ product_id: e.product_id, quantity: parseFloat(e.quantity) || 0, unit: e.unit }))),
      ])
      if (bRes.error || iRes.error) return

      const newIngs: CocktailIngredient[] = editIngs.map((e, i) => ({ id: `edit-${i}`, product_id: e.product_id, product_name: e.product_name, quantity: parseFloat(e.quantity) || 0, unit: e.unit, cost_price: e.cost_price, volume_ml: e.volume_ml, stock: e.stock }))
      const np = editPrice ? parseFloat(editPrice) : null
      const nt = totalCost(newIngs.map(i => ({ qty: i.quantity, unit: i.unit, cost_price: i.cost_price, volume_ml: i.volume_ml })))
      const nr = nt && np ? (nt / np) * 100 : null

      setCocktails(prev => prev.map(c => c.id === id ? { ...c, name: editName, name_en: editNameEn, description: editDescription, selling_price: np, tags: editTags ? editTags.split(',').map(t => t.trim()).filter(Boolean) : [], is_available: editAvail, recipe_steps: cleanSteps, ingredients: newIngs, total_cost: nt, cost_rate_pct: nr } : c))
      setEditingId(null)
    })
  }

  function handleDelete(id: string) {
    if (!confirm('このカクテルを削除しますか？')) return
    startTransition(async () => {
      await deleteCocktail(id)
      setCocktails(prev => prev.filter(c => c.id !== id))
    })
  }

  function handleToggle(id: string, val: boolean) {
    startTransition(async () => {
      await toggleCocktailAvailability(id, val)
      setCocktails(prev => prev.map(c => c.id === id ? { ...c, is_available: val } : c))
    })
  }

  /* ── レシピ手順UI ── */
  function RecipeStepsEditor({ steps, onChange }: { steps: string[]; onChange: (s: string[]) => void }) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>レシピ手順</p>
          <button
            type="button"
            onClick={() => onChange([...steps, ''])}
            className="flex items-center gap-1 text-xs px-2.5 h-6 rounded-lg transition-opacity hover:opacity-70"
            style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            <RiAddLine size={11} />
            追加
          </button>
        </div>
        {steps.map((s, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <span className="text-[11px] font-bold tabular-nums mt-2.5 w-5 text-right flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
              {idx + 1}
            </span>
            <textarea
              value={s}
              onChange={e => { const ns = [...steps]; ns[idx] = e.target.value; onChange(ns) }}
              placeholder={`手順 ${idx + 1}`}
              rows={2}
              className="flex-1 px-3 py-2 text-sm rounded-xl outline-none resize-none"
              style={fieldBase}
            />
            {steps.length > 1 && (
              <button
                type="button"
                onClick={() => onChange(steps.filter((_, i) => i !== idx))}
                className="mt-1 w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--bg-surface)]"
                style={{ color: 'var(--text-muted)', flexShrink: 0 }}
              >
                <RiCloseLine size={13} />
              </button>
            )}
          </div>
        ))}
      </div>
    )
  }

  /* ── レンダリング ── */
  return (
    <div className="max-w-5xl space-y-6">

      {/* ヘッダー */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>カクテル管理</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{cocktails.length} 件</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 h-10 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 flex-shrink-0"
            style={{ background: 'rgba(129,236,255,0.12)', color: '#81ecff', border: '1px solid rgba(129,236,255,0.3)' }}
          >
            <RiAddLine size={16} />
            <span className="hidden sm:inline">カクテルを追加</span>
            <span className="sm:hidden">追加</span>
          </button>
        )}
      </div>


      {/* ━━━ Stepperフォーム ━━━ */}
      {showForm && (
        <div className="glass-stepper rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>カクテルを追加</p>
              <button onClick={resetForm} className="text-xs px-3 h-7 rounded-lg transition-opacity hover:opacity-70" style={{ color: 'var(--text-muted)', background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                キャンセル
              </button>
            </div>
            <Stepper activeStep={step} alternativeLabel sx={STEPPER_SX}>
              {STEP_LABELS.map(l => <Step key={l}><StepLabel>{l}</StepLabel></Step>)}
            </Stepper>
          </div>

          <div className="p-5">
            {/* Step 0: 材料選択 */}
            {step === 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>材料を選んでください</p>
                  {selectedProducts.length > 0 && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(129,236,255,0.12)', color: '#81ecff', border: '1px solid rgba(129,236,255,0.3)' }}>
                      {selectedProducts.length} 種類選択中
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 px-3 h-10 rounded-xl" style={fieldBase}>
                  <RiSearchLine size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <input value={query} onChange={e => setQuery(e.target.value)} placeholder="商品名・カテゴリで検索..." className="flex-1 text-sm bg-transparent outline-none" style={{ color: 'var(--text-primary)' }} autoFocus />
                </div>
                <div className="glass-bottle-list overflow-y-auto" style={{ maxHeight: 260, borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                  {filteredProducts.length === 0
                    ? <p className="text-sm text-center py-10" style={{ color: 'var(--text-muted)' }}>商品が見つかりません</p>
                    : filteredProducts.map((p, i) => {
                        const active = selectedProducts.some(s => s.id === p.id)
                        return (
                          <button key={p.id} onClick={() => toggleProduct(p)} className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                            style={{ borderBottom: i < filteredProducts.length - 1 ? '1px solid var(--border)' : undefined, background: active ? 'var(--bg-dark)' : 'var(--bg-surface)' }}>
                            <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={active ? { background: '#22c55e' } : { border: '1.5px solid var(--border)', background: 'transparent' }}>
                              {active && <RiCheckLine size={9} color="#fff" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate" style={{ color: active ? 'var(--text-primary)' : 'var(--text-primary)' }}>{p.name}</p>
                              {p.category && <p className="text-[11px]" style={{ color: active ? '#9ab4bc' : 'var(--text-muted)' }}>{p.category}</p>}
                            </div>
                            {p.stock <= 0 && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: active ? 'rgba(239,68,68,0.3)' : '#fef2f2', color: active ? '#fca5a5' : '#ef4444' }}>
                                在庫なし
                              </span>
                            )}
                            {p.volume_ml && <p className="text-[10px] tabular-nums flex-shrink-0" style={{ color: active ? '#9ab4bc' : 'var(--text-muted)' }}>{p.volume_ml}ml</p>}
                          </button>
                        )
                      })
                  }
                </div>
                {selectedProducts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProducts.map(p => (
                      <span key={p.id} className="flex items-center gap-1 px-2.5 h-7 rounded-xl text-xs font-semibold" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                        {p.name}
                        <button onClick={() => toggleProduct(p)} className="ml-0.5 flex items-center" style={{ color: 'var(--text-muted)' }}><RiCloseLine size={12} /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 1: 使用量 */}
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>各材料の使用量を入力してください</p>
                <div className="space-y-3">
                  {ingDrafts.map((d, idx) => (
                    <div key={d.product.id} className="flex items-center gap-2 sm:gap-3">
                      <p className="flex-1 text-sm font-medium truncate min-w-0" style={{ color: 'var(--text-primary)' }}>{d.product.name}</p>
                      <input type="number" min="0" step="0.5" value={d.quantity} onChange={e => updateDraft(idx, 'quantity', e.target.value)} placeholder="量" className="w-20 px-3 h-9 text-sm rounded-xl outline-none tabular-nums text-right" style={fieldBase} />
                      <select value={d.unit} onChange={e => updateDraft(idx, 'unit', e.target.value)} className="h-9 px-2 text-sm rounded-xl outline-none" style={fieldBase}>
                        {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: 基本情報・価格 */}
            {step === 2 && (
              <div className="space-y-5">
                {/* 原価テーブル */}
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>材料原価</p>
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                    {stepCostRows.map((r, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2.5" style={{ borderBottom: i < stepCostRows.length - 1 ? '1px solid var(--border)' : undefined, background: 'var(--bg-base)' }}>
                        <p className="flex-1 truncate text-xs" style={{ color: 'var(--text-primary)' }}>{r.name}</p>
                        <p className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>{r.qty}{r.unit}</p>
                        <p className="text-xs font-semibold tabular-nums w-16 text-right" style={{ color: r.cost != null ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          {r.cost != null ? `¥${r.cost.toFixed(1)}` : '—'}
                        </p>
                      </div>
                    ))}
                    <div className="flex items-center justify-between px-3 py-2.5" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}>
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>合計原価</p>
                      <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{stepTotal != null ? `¥${stepTotal.toFixed(1)}` : '—'}</p>
                    </div>
                  </div>
                </div>

                {/* カクテル名 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>カクテル名 *</label>
                    <input required value={cocktailName} onChange={e => setCocktailName(e.target.value)} placeholder="例: ネグローニ" className="w-full px-3 h-10 text-sm rounded-xl outline-none" style={fieldBase} autoFocus />
                  </div>
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>英語名</label>
                    <input value={cocktailNameEn} onChange={e => setCocktailNameEn(e.target.value)} placeholder="例: Negroni" className="w-full px-3 h-10 text-sm rounded-xl outline-none" style={fieldBase} />
                  </div>
                </div>

                {/* 販売価格 */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>販売価格</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>¥</span>
                    <input type="number" min="0" step="100" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} placeholder="例: 1200" className="w-36 px-3 h-10 text-sm rounded-xl outline-none tabular-nums" style={fieldBase} />
                  </div>
                  {stepRate != null && (
                    <div className="flex items-center gap-3">
                      <div className="h-2 rounded-full overflow-hidden flex-1 max-w-36" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, stepRate)}%`, background: stepRate > 50 ? '#ef4444' : stepRate > 30 ? '#f59e0b' : '#22c55e' }} />
                      </div>
                      <p className="text-sm font-bold tabular-nums" style={{ color: stepRate > 50 ? '#ef4444' : stepRate > 30 ? '#f59e0b' : '#22c55e' }}>
                        原価率 {stepRate.toFixed(1)}%
                      </p>
                    </div>
                  )}
                </div>

                {/* レシピ手順 */}
                <RecipeStepsEditor steps={recipeSteps} onChange={setRecipeSteps} />
              </div>
            )}

            {/* ナビゲーション */}
            <div className="flex items-center gap-2 mt-6 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-1.5 px-4 h-9 rounded-xl text-sm font-semibold transition-opacity hover:opacity-70" style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                  <RiArrowLeftLine size={14} />戻る
                </button>
              )}
              <div className="flex-1" />
              {step === 0 && <button onClick={goStep2} disabled={!canNext1} className="px-6 h-9 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40" style={{ background: 'rgba(129,236,255,0.12)', color: '#81ecff', border: '1px solid rgba(129,236,255,0.3)' }}>次へ</button>}
              {step === 1 && <button onClick={() => setStep(2)} disabled={!canNext2} className="px-6 h-9 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40" style={{ background: 'rgba(129,236,255,0.12)', color: '#81ecff', border: '1px solid rgba(129,236,255,0.3)' }}>次へ</button>}
              {step === 2 && <button onClick={handleRegister} disabled={isPending || !cocktailName.trim()} className="px-6 h-9 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40" style={{ background: 'rgba(129,236,255,0.12)', color: '#81ecff', border: '1px solid rgba(129,236,255,0.3)' }}>{isPending ? '登録中...' : '登録する'}</button>}
            </div>
          </div>
        </div>
      )}

      {/* ━━━ カクテル一覧 ━━━ */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        {cocktails.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RiCupFill size={32} style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>カクテルがまだありません</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {cocktails.map(c => (
              <div key={c.id}>
                {/* ── サマリー行 ── */}
                <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  {/* 展開ボタン */}
                  <button
                    onClick={() => setExpandedId(id => id === c.id ? null : c.id)}
                    className="flex-1 flex items-center gap-3 min-w-0 text-left"
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-base)' }}>
                      <RiCupFill size={16} style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: c.is_available ? 'var(--text-primary)' : 'var(--text-muted)' }}>{c.name}</p>
                        {c.ingredients.some(i => i.stock <= 0) && (
                          <span className="flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5' }}>
                            <RiAlertLine size={9} />在庫不足
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                        {c.ingredients.length > 0 ? `材料 ${c.ingredients.length} 種` : '材料未登録'}
                        {c.selling_price != null ? ` · ¥${c.selling_price.toLocaleString()}` : ''}
                      </p>
                    </div>
                    <RiArrowDownSLine
                      size={16}
                      style={{
                        color: 'var(--text-muted)',
                        flexShrink: 0,
                        transition: 'transform 0.15s',
                        transform: expandedId === c.id ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    />
                  </button>

                  {/* 右側操作 */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {c.cost_rate_pct != null && (
                      <p className="text-[11px] tabular-nums hidden sm:flex items-center gap-1 mr-1" style={{ color: c.cost_rate_pct > 50 ? '#ef4444' : c.cost_rate_pct > 30 ? '#f59e0b' : '#22c55e' }}>
                        <RiPriceTag3Fill size={10} />
                        {c.cost_rate_pct.toFixed(1)}%
                      </p>
                    )}
                    <button onClick={() => handleToggle(c.id, !c.is_available)} className="px-2.5 h-6 text-[10px] font-semibold rounded-full transition-opacity hover:opacity-80 whitespace-nowrap"
                      style={c.is_available ? { background: '#22c55e22', color: '#16a34a' } : { background: 'var(--bg-base)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                      {c.is_available ? '公開' : '非公開'}
                    </button>
                    <button onClick={() => startEdit(c)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--bg-base)]"
                      style={{ color: editingId === c.id ? 'var(--text-primary)' : 'var(--text-muted)' }} title="編集">
                      {editingId === c.id ? <RiCloseLine size={15} /> : <RiEditLine size={14} />}
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--bg-base)]" style={{ color: '#ef4444' }} title="削除">
                      <RiDeleteBinLine size={14} />
                    </button>
                  </div>
                </div>

                {/* ── 詳細パネル（PW解除後） ── */}
                {expandedId === c.id && (
                  <div className="px-5 py-4 space-y-4" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-base)' }}>
                    {/* 材料・原価 */}
                    {c.ingredients.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>材料・原価</p>
                        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                          {c.ingredients.map((ing, i) => {
                            const cost = calcIngCost(ing.quantity, ing.unit, ing.cost_price, ing.volume_ml)
                            return (
                              <div key={ing.id} className="flex items-center gap-3 px-3 py-2.5 text-sm" style={{ borderBottom: i < c.ingredients.length - 1 ? '1px solid var(--border)' : undefined, background: 'var(--bg-surface)' }}>
                                <p className="flex-1 text-xs truncate" style={{ color: 'var(--text-primary)' }}>{ing.product_name}</p>
                                {ing.stock <= 0 && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: '#fef2f2', color: '#ef4444' }}>在庫なし</span>}
                                <p className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>{ing.quantity}{ing.unit}</p>
                                <p className="text-xs font-semibold tabular-nums w-16 text-right" style={{ color: cost != null ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                  {cost != null ? `¥${cost.toFixed(1)}` : '—'}
                                </p>
                              </div>
                            )
                          })}
                          <div className="flex items-center justify-between px-3 py-2.5" style={{ background: 'var(--bg-base)', borderTop: '1px solid var(--border)' }}>
                            <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>合計原価</p>
                            <div className="flex items-center gap-3">
                              {c.total_cost != null && <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>¥{c.total_cost.toFixed(1)}</p>}
                              {c.cost_rate_pct != null && (
                                <p className="text-xs font-semibold tabular-nums" style={{ color: c.cost_rate_pct > 50 ? '#ef4444' : c.cost_rate_pct > 30 ? '#f59e0b' : '#22c55e' }}>
                                  原価率 {c.cost_rate_pct.toFixed(1)}%
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* レシピ手順 */}
                    {c.recipe_steps.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>レシピ手順</p>
                        <ol className="space-y-2">
                          {c.recipe_steps.map((s, i) => (
                            <li key={i} className="flex gap-3 text-sm">
                              <span className="text-xs font-bold tabular-nums mt-0.5 w-5 flex-shrink-0 text-right" style={{ color: 'var(--text-muted)' }}>{i + 1}</span>
                              <p style={{ color: 'var(--text-primary)' }}>{s}</p>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                )}

                {/* ── 編集パネル ── */}
                {editingId === c.id && (
                  <div className="glass-stepper px-5 py-5 space-y-5" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-base)' }}>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1 col-span-2 sm:col-span-1">
                        <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>カクテル名</label>
                        <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-3 h-9 text-sm rounded-xl outline-none" style={fieldBase} />
                      </div>
                      <div className="space-y-1 col-span-2 sm:col-span-1">
                        <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>英語名</label>
                        <input value={editNameEn} onChange={e => setEditNameEn(e.target.value)} className="w-full px-3 h-9 text-sm rounded-xl outline-none" style={fieldBase} />
                      </div>
                      <div className="space-y-1 col-span-2">
                        <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>コメント</label>
                        <textarea
                          value={editDescription}
                          onChange={e => setEditDescription(e.target.value)}
                          placeholder="カクテルの説明・コメントを入力..."
                          rows={3}
                          className="w-full px-3 py-2 text-sm rounded-xl outline-none resize-none"
                          style={fieldBase}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>販売価格</label>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>¥</span>
                          <input type="number" min="0" value={editPrice} onChange={e => setEditPrice(e.target.value)} className="w-full px-3 h-9 text-sm rounded-xl outline-none tabular-nums" style={fieldBase} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>タグ (カンマ区切り)</label>
                        <input value={editTags} onChange={e => setEditTags(e.target.value)} className="w-full px-3 h-9 text-sm rounded-xl outline-none" style={fieldBase} />
                      </div>
                      <div className="col-span-2 flex items-center gap-2">
                        <input type="checkbox" id={`avail-${c.id}`} checked={editAvail} onChange={e => setEditAvail(e.target.checked)} className="w-4 h-4" />
                        <label htmlFor={`avail-${c.id}`} className="text-sm" style={{ color: 'var(--text-primary)' }}>メニューに公開する</label>
                      </div>
                    </div>

                    {/* 材料編集 */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>材料</p>
                      {editIngs.length === 0
                        ? <p className="text-xs" style={{ color: 'var(--text-muted)' }}>材料が登録されていません</p>
                        : editIngs.map((e, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <p className="flex-1 text-sm truncate min-w-0" style={{ color: 'var(--text-primary)' }}>{e.product_name}</p>
                              <input type="number" min="0" step="0.5" value={e.quantity} onChange={ev => updateEditIng(idx, 'quantity', ev.target.value)} className="w-20 px-3 h-8 text-sm rounded-xl outline-none tabular-nums text-right" style={fieldBase} />
                              <select value={e.unit} onChange={ev => updateEditIng(idx, 'unit', ev.target.value)} className="h-8 px-2 text-sm rounded-xl outline-none" style={fieldBase}>
                                {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                              </select>
                              <button onClick={() => setEditIngs(prev => prev.filter((_, i) => i !== idx))} className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--bg-surface)]" style={{ color: '#ef4444' }}>
                                <RiDeleteBinLine size={13} />
                              </button>
                            </div>
                          ))
                      }
                      {/* 材料追加検索 */}
                      <div className="relative mt-2">
                        <div className="flex items-center gap-2 px-3 h-9 rounded-xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                          <RiSearchLine size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          <input value={addIngQuery} onChange={e => setAddIngQuery(e.target.value)} placeholder="材料を追加..." className="flex-1 text-sm bg-transparent outline-none" style={{ color: 'var(--text-primary)' }} />
                        </div>
                        {addIngResults.length > 0 && (
                          <div className="absolute left-0 right-0 z-10 rounded-xl overflow-hidden shadow-lg" style={{ top: 'calc(100% + 4px)', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                            {addIngResults.map((p, i) => (
                              <button key={p.id} onClick={() => addIngToEdit(p)} className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-[var(--bg-base)]"
                                style={{ borderBottom: i < addIngResults.length - 1 ? '1px solid var(--border)' : undefined, color: 'var(--text-primary)' }}>
                                <span className="flex-1 truncate">{p.name}</span>
                                {p.volume_ml && <span className="text-[11px] tabular-nums" style={{ color: 'var(--text-muted)' }}>{p.volume_ml}ml</span>}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* レシピ手順編集 */}
                    <RecipeStepsEditor steps={editSteps} onChange={setEditSteps} />

                    <div className="flex items-center gap-2 justify-end pt-1">
                      <button onClick={() => setEditingId(null)} className="px-4 h-9 text-sm rounded-xl transition-opacity hover:opacity-70" style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                        キャンセル
                      </button>
                      <button onClick={() => handleSaveEdit(c.id)} disabled={isPending} className="px-5 h-9 text-sm font-semibold rounded-xl transition-opacity hover:opacity-80 disabled:opacity-40" style={{ background: 'rgba(129,236,255,0.12)', color: '#81ecff', border: '1px solid rgba(129,236,255,0.3)' }}>
                        {isPending ? '保存中...' : '保存'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
