'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { RiArrowLeftLine } from 'react-icons/ri'
import { createProduct, updateProduct } from '@/app/admin/(protected)/products/actions'
import { calcCostRate } from '@/lib/format'
import { styles } from '@/lib/ui'

type Category = { id: string; name: string; name_en: string }
type Supplier  = { id: string; name: string }
type DetailType = 'wine' | 'spirits' | 'soft_drink' | null

export type ProductInitialData = {
  name:                 string
  name_en:              string
  category_id:          string | null
  supplier_id:          string | null
  default_supplier_id:  string | null
  unit:                 string
  cost_price:           number | null
  selling_price:        number | null
  tags:                 string[]
  notes:                string | null
  is_available:         boolean
  is_recommended:       boolean
  custom_tag:           string | null
  display_out_of_stock: boolean
  image_url:            string | null
}

function getDetailType(categories: Category[], categoryId: string): DetailType {
  const cat = categories.find(c => c.id === categoryId)
  if (!cat) return null
  switch (cat.name_en) {
    case 'Wine':
    case 'Champagne':   return 'wine'
    case 'Spirits':     return 'spirits'
    case 'Soft Drink':  return 'soft_drink'
    default:            return null
  }
}

export default function ProductForm({
  categories,
  suppliers,
  productId,
  initialData,
}: {
  categories:   Category[]
  suppliers:    Supplier[]
  productId?:   string
  initialData?: ProductInitialData
}) {
  const isEdit = !!productId
  const d      = initialData

  const [categoryId, setCategoryId] = useState(d?.category_id ?? '')
  const detailType = getDetailType(categories, categoryId)

  const [costPrice,    setCostPrice]    = useState<string>(String(d?.cost_price    ?? ''))
  const [sellingPrice, setSellingPrice] = useState<string>(String(d?.selling_price ?? ''))

  const costRate = calcCostRate(parseFloat(costPrice), parseFloat(sellingPrice))

  const action = isEdit ? updateProduct.bind(null, productId) : createProduct

  return (
    <div className="max-w-2xl space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/products"
          className="p-2 rounded-xl transition-colors hover:bg-[var(--bg-surface)]"
          style={{ color: 'var(--text-muted)' }}
        >
          <RiArrowLeftLine size={16} />
        </Link>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {isEdit ? '商品を編集' : '商品を追加'}
        </h1>
      </div>

      <form
        action={action}
        className="rounded-2xl p-4 sm:p-6 space-y-5"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <input type="hidden" name="detail_type" value={detailType ?? ''} />

        {/* 商品名 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="商品名 *">
            <input name="name" required defaultValue={d?.name} placeholder="例: ヘネシー XO" className={inputClass} style={inputStyle} />
          </Field>
          <Field label="商品名（英語）">
            <input name="name_en" defaultValue={d?.name_en} placeholder="e.g. Hennessy XO" className={inputClass} style={inputStyle} />
          </Field>
        </div>

        {/* カテゴリ・発注先 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="カテゴリ">
            <select
              name="category_id"
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className={inputClass}
              style={inputStyle}
            >
              <option value="">選択してください</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="発注先">
            <select name="supplier_id" defaultValue={d?.supplier_id ?? ''} className={inputClass} style={inputStyle}>
              <option value="">選択してください</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* 価格 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="単位">
            <input name="unit" defaultValue={d?.unit ?? '本'} placeholder="本 / ml / g" className={inputClass} style={inputStyle} />
          </Field>
          <Field label="仕入れ価格（¥）">
            <input
              name="cost_price"
              type="number"
              min="0"
              step="1"
              value={costPrice}
              onChange={e => setCostPrice(e.target.value)}
              placeholder="0"
              className={inputClass}
              style={inputStyle}
            />
          </Field>
          <Field label="販売価格（¥）">
            <input
              name="selling_price"
              type="number"
              min="0"
              step="1"
              value={sellingPrice}
              onChange={e => setSellingPrice(e.target.value)}
              placeholder="0"
              className={inputClass}
              style={inputStyle}
            />
          </Field>
        </div>

        {/* 原価率 */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}
        >
          <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>原価率</span>
          {costRate === null ? (
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>—</span>
          ) : (
            <>
              <span
                className="text-lg font-bold tabular-nums"
                style={{ color: costRate > 40 ? '#f87171' : costRate > 30 ? '#fb923c' : '#22c55e' }}
              >
                {costRate}%
              </span>
              <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
                ¥{parseFloat(costPrice).toLocaleString()} ÷ ¥{parseFloat(sellingPrice).toLocaleString()}
              </span>
            </>
          )}
        </div>

        {/* 表示設定 */}
        <Divider title="表示設定" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="カスタムタグ">
            <input name="custom_tag" defaultValue={d?.custom_tag ?? ''} placeholder='例: NEW, SOLD OUT' className={inputClass} style={inputStyle} />
          </Field>
          <Field label="デフォルト発注先">
            <select name="default_supplier_id" defaultValue={d?.default_supplier_id ?? ''} className={inputClass} style={inputStyle}>
              <option value="">選択してください</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="flex gap-6">
          <CheckField name="is_recommended"       label="おすすめ表示"             defaultChecked={d?.is_recommended} />
          <CheckField name="display_out_of_stock" label="在庫切れ時もメニューに表示" defaultChecked={d?.display_out_of_stock} />
        </div>

        {/* カテゴリ別詳細 */}
        {detailType === 'wine'       && <WineSection />}
        {detailType === 'spirits'    && <SpiritsSection />}
        {detailType === 'soft_drink' && <SoftDrinkSection />}

        {/* タグ */}
        <Divider title="その他" />
        <Field label="タグ（カンマ区切り）">
          <input name="tags" defaultValue={d?.tags?.join(', ') ?? ''} placeholder="例: ブランデー, フランス, プレミアム" className={inputClass} style={inputStyle} />
        </Field>

        {/* 画像 */}
        <Field label="商品画像">
          {d?.image_url && (
            <div className="mb-2">
              <Image src={d.image_url} alt="現在の画像" width={72} height={72} className="rounded-xl object-cover" />
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>現在の画像 — 新しいファイルを選ぶと差し替えられます</p>
            </div>
          )}
          <input
            name="image"
            type="file"
            accept="image/*"
            className="w-full text-sm file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:cursor-pointer"
            style={{
              color: 'var(--text-secondary)',
              background: 'var(--bg-base)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '8px 12px',
            }}
          />
        </Field>

        {/* 備考 */}
        <Field label="備考">
          <textarea name="notes" rows={3} defaultValue={d?.notes ?? ''} placeholder="自由記述" className={`${inputClass} resize-none`} style={inputStyle} />
        </Field>

        {/* 提供状態 */}
        <Field label="提供状態">
          <div className="flex gap-3">
            {[{ value: 'true', label: '提供中' }, { value: 'false', label: '入荷待ち' }].map(({ value, label }) => (
              <label key={value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="is_available"
                  value={value}
                  defaultChecked={d ? (d.is_available ? value === 'true' : value === 'false') : value === 'true'}
                  className="accent-current"
                />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
              </label>
            ))}
          </div>
        </Field>

        {/* ボタン */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
            style={styles.btnPrimary}
          >
            {isEdit ? '更新する' : '登録する'}
          </button>
          <Link
            href="/admin/products"
            className="px-6 py-3 rounded-xl text-sm font-medium transition-colors"
            style={styles.btnSecondary}
          >
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  )
}

// ─── カテゴリ別詳細セクション ────────────────────────────────────────────────

function WineSection() {
  return (
    <>
      <Divider title="ワイン詳細" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="生産国">
          <input name="wine_country" placeholder="例: フランス" className={inputClass} style={inputStyle} />
        </Field>
        <Field label="産地（日本語）">
          <input name="wine_region" placeholder="例: ボルドー" className={inputClass} style={inputStyle} />
        </Field>
        <Field label="産地（英語）">
          <input name="wine_region_en" placeholder="e.g. Bordeaux" className={inputClass} style={inputStyle} />
        </Field>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Field label="種別">
          <select name="wine_type" className={inputClass} style={inputStyle}>
            <option value="other">未設定</option>
            <option value="white">白ワイン</option>
            <option value="red">赤ワイン</option>
            <option value="rosé">ロゼ</option>
            <option value="sparkling">スパークリング</option>
            <option value="champagne">シャンパン</option>
          </select>
        </Field>
        <Field label="ブドウ品種（カンマ区切り）">
          <input name="wine_grape_varieties" placeholder="例: Cabernet Sauvignon, Merlot" className={inputClass} style={inputStyle} />
        </Field>
        <Field label="ボディ">
          <select name="wine_body" className={inputClass} style={inputStyle}>
            <option value="">未設定</option>
            <option value="light">ライト</option>
            <option value="medium">ミディアム</option>
            <option value="full">フル</option>
          </select>
        </Field>
        <Field label="ヴィンテージ">
          <input name="wine_vintage" type="number" min="1900" max="2100" placeholder="例: 2020" className={inputClass} style={inputStyle} />
        </Field>
      </div>
      <Field label="説明（日本語）">
        <textarea name="wine_description" rows={2} placeholder="テイスティングノート等" className={`${inputClass} resize-none`} style={inputStyle} />
      </Field>
      <Field label="説明（英語）">
        <textarea name="wine_description_en" rows={2} placeholder="Tasting notes, etc." className={`${inputClass} resize-none`} style={inputStyle} />
      </Field>
    </>
  )
}

function SpiritsSection() {
  return (
    <>
      <Divider title="スピリッツ詳細" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="種別">
          <input name="spirits_type" list="spirits-types" placeholder="例: Whisky, Gin, Vodka" className={inputClass} style={inputStyle} />
          <datalist id="spirits-types">
            {['Whisky', 'Bourbon', 'Gin', 'Vodka', 'Rum', 'Tequila', 'Brandy', 'Cognac', 'Mezcal', 'Shochu'].map(t => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </Field>
        <Field label="熟成年数">
          <input name="spirits_age_statement" placeholder="例: 12 Years, NAS" className={inputClass} style={inputStyle} />
        </Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="容量（ml）">
          <input name="spirits_volume_ml" type="number" min="1" placeholder="例: 700" className={inputClass} style={inputStyle} />
        </Field>
        <Field label="ショット価格（¥）">
          <input name="spirits_shot_price" type="number" min="0" step="1" placeholder="0" className={inputClass} style={inputStyle} />
        </Field>
      </div>
    </>
  )
}

function SoftDrinkSection() {
  return (
    <>
      <Divider title="ソフトドリンク詳細" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="容量（ml）">
          <input name="soft_drink_volume_ml" type="number" min="1" placeholder="例: 350" className={inputClass} style={inputStyle} />
        </Field>
        <div className="flex items-end pb-2">
          <CheckField name="soft_drink_is_mixer" label="ミキサー用途（原価計算対象）" />
        </div>
      </div>
    </>
  )
}

// ─── 共通 UI ────────────────────────────────────────────────────────────────

function Divider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <span className="text-xs font-semibold shrink-0" style={{ color: 'var(--text-muted)' }}>{title}</span>
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      {children}
    </div>
  )
}

function CheckField({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" name={name} value="true" defaultChecked={defaultChecked} className="accent-current" />
      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
    </label>
  )
}

const inputClass = 'w-full px-3 py-3 rounded-xl text-base outline-none transition-colors'
const inputStyle = styles.input
