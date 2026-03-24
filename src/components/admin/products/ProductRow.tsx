'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { RiPencilFill, RiEyeFill, RiEyeOffFill, RiAlertFill } from 'react-icons/ri'
import { updateProductAvailability, updateDisplayOutOfStock } from '@/app/admin/(protected)/products/actions'
import { updateMinQuantity } from '@/app/admin/(protected)/stock/actions'
import type { ProductWithRelations } from '@/lib/types/database'

type Props = {
  product: ProductWithRelations
  isLast:  boolean
}

function resolveStock(raw: ProductWithRelations['stock']) {
  if (!raw) return null
  return Array.isArray(raw) ? (raw[0] ?? null) : raw
}

export function ProductRow({ product, isLast }: Props) {
  const router  = useRouter()
  const stock   = resolveStock(product.stock)

  const [visible,  setVisible]  = useState(product.display_out_of_stock)
  const [waiting,  setWaiting]  = useState(!product.is_available)
  const [busyV,    setBusyV]    = useState(false)
  const [busyW,    setBusyW]    = useState(false)
  const [minQty,   setMinQty]   = useState<number>(stock?.min_quantity ?? 0)
  const [minInput, setMinInput] = useState(String(stock?.min_quantity ?? 0))
  const [busyM,    setBusyM]    = useState(false)

  const currentQty  = stock?.quantity ?? null
  const isLowStock  = currentQty !== null && minQty > 0 && currentQty < minQty

  async function handleMinQtyBlur() {
    const val = parseFloat(minInput)
    if (isNaN(val) || val < 0 || val === minQty) { setMinInput(String(minQty)); return }
    setBusyM(true)
    try {
      await updateMinQuantity(product.id, val)
      setMinQty(val)
      router.refresh()
    } catch {
      setMinInput(String(minQty))
    } finally {
      setBusyM(false)
    }
  }

  async function toggleVisible() {
    if (busyV) return
    const next = !visible
    setVisible(next)
    setBusyV(true)
    try {
      await updateDisplayOutOfStock(product.id, next)
      router.refresh()
    } catch {
      setVisible(!next)
    } finally {
      setBusyV(false)
    }
  }

  async function toggleWaiting() {
    if (busyW) return
    const next = !waiting
    setWaiting(next)
    setBusyW(true)
    try {
      await updateProductAvailability(product.id, !next)
      router.refresh()
    } catch {
      setWaiting(!next)
    } finally {
      setBusyW(false)
    }
  }

  return (
    <tr
      className="group transition-colors hover:bg-[var(--bg-base)]"
      style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)' }}
    >
      {/* ── 表示 ── */}
      <td className="pl-4 pr-2 py-3 w-10">
        <button
          onClick={toggleVisible}
          disabled={busyV}
          title={visible ? 'メニューに表示中 — クリックで非表示' : '非表示 — クリックで表示'}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-50 hover:scale-105 active:scale-95"
          style={{
            background: visible ? 'var(--bg-dark)' : 'var(--bg-base)',
            color:      visible ? 'var(--text-invert)' : 'var(--text-muted)',
            border:     visible ? 'none' : '1px solid var(--border)',
          }}
        >
          {visible ? <RiEyeFill size={13} /> : <RiEyeOffFill size={13} />}
        </button>
      </td>

      {/* 商品名 */}
      <td className="px-4 py-3">
        <p className="font-medium" style={{ color: visible ? 'var(--text-primary)' : 'var(--text-muted)' }}>
          {product.name}
        </p>
        {product.name_en && (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{product.name_en}</p>
        )}
      </td>

      {/* カテゴリ */}
      <td className="px-4 py-3">
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {product.categories?.name ?? '—'}
        </span>
      </td>

      {/* 発注先 */}
      <td className="px-4 py-3">
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {product.suppliers?.name ?? '—'}
        </span>
      </td>

      {/* 販売価格 */}
      <td className="px-4 py-3">
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {product.selling_price != null ? `¥${product.selling_price.toLocaleString()}` : '—'}
        </span>
      </td>

      {/* 最低在庫 */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          {isLowStock && (
            <RiAlertFill size={12} style={{ color: 'var(--text-primary)', flexShrink: 0 }} title="在庫不足" />
          )}
          <input
            type="number"
            min="0"
            value={minInput}
            onChange={e => setMinInput(e.target.value)}
            onBlur={handleMinQtyBlur}
            onKeyDown={e => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
            disabled={busyM}
            className="w-16 px-2 py-1 rounded-lg text-xs tabular-nums outline-none text-right disabled:opacity-50"
            style={{
              background: 'var(--bg-base)',
              border:     '1px solid var(--border)',
              color:      isLowStock ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
          />
        </div>
      </td>

      {/* ── 状態 ── */}
      <td className="px-4 py-3">
        <button
          onClick={toggleWaiting}
          disabled={busyW}
          title={waiting ? '入荷待ち — クリックで提供中に' : '提供中 — クリックで入荷待ちに'}
          className="px-2.5 py-1 rounded-lg text-xs font-medium transition-opacity hover:opacity-70 disabled:opacity-40"
          style={{
            background: waiting ? 'var(--bg-base)' : 'var(--bg-dark)',
            color:      waiting ? 'var(--text-muted)' : 'var(--text-invert)',
            border:     waiting ? '1px solid var(--border)' : 'none',
          }}
        >
          {waiting ? '入荷待ち' : '提供中'}
        </button>
      </td>

      {/* アクション */}
      <td className="px-4 py-3">
        <Link
          href={`/admin/products/${product.id}/edit`}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg inline-flex"
          style={{ color: 'var(--text-secondary)' }}
        >
          <RiPencilFill size={14} />
        </Link>
      </td>
    </tr>
  )
}
