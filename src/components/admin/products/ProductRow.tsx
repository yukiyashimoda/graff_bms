'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { RiPencilFill, RiEyeFill, RiEyeOffFill, RiAlertFill, RiDeleteBinFill } from 'react-icons/ri'
import { updateProductAvailability, updateDisplayOutOfStock, deleteProduct } from '@/app/admin/(protected)/products/actions'
import { updateMinQuantity } from '@/app/admin/(protected)/stock/actions'
import type { ProductWithRelations } from '@/lib/types/database'

function resolveStock(raw: ProductWithRelations['stock']) {
  if (!raw) return null
  return Array.isArray(raw) ? (raw[0] ?? null) : raw
}

export function ProductRow({ product }: { product: ProductWithRelations }) {
  const router = useRouter()
  const stock  = resolveStock(product.stock)

  const [visible,  setVisible]  = useState(product.display_out_of_stock)
  const [waiting,  setWaiting]  = useState(!product.is_available)
  const [busyV,    setBusyV]    = useState(false)
  const [busyW,    setBusyW]    = useState(false)
  const [minQty,   setMinQty]   = useState<number>(stock?.min_quantity ?? 0)
  const [minInput, setMinInput] = useState(String(stock?.min_quantity ?? 0))
  const [busyM,    setBusyM]    = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [busyDel,    setBusyDel]    = useState(false)

  const currentQty = stock?.quantity ?? null
  const isLow      = currentQty !== null && minQty > 0 && currentQty < minQty
  const pct        = minQty > 0 && currentQty !== null
    ? Math.min(100, Math.round((currentQty / minQty) * 100))
    : 100

  const catName = (product.categories as { name: string } | null)?.name
  const supName = (product.suppliers  as { name: string } | null)?.name

  async function toggleVisible() {
    if (busyV) return
    const next = !visible
    setVisible(next)
    setBusyV(true)
    try { await updateDisplayOutOfStock(product.id, next); router.refresh() }
    catch { setVisible(!next) }
    finally { setBusyV(false) }
  }

  async function toggleWaiting() {
    if (busyW) return
    const next = !waiting
    setWaiting(next)
    setBusyW(true)
    try { await updateProductAvailability(product.id, !next); router.refresh() }
    catch { setWaiting(!next) }
    finally { setBusyW(false) }
  }

  async function handleMinQtyBlur() {
    const val = parseFloat(minInput)
    if (isNaN(val) || val < 0 || val === minQty) { setMinInput(String(minQty)); return }
    setBusyM(true)
    try { await updateMinQuantity(product.id, val); setMinQty(val); router.refresh() }
    catch { setMinInput(String(minQty)) }
    finally { setBusyM(false) }
  }

  return (
    <div
      className="product-card flex flex-col rounded-2xl overflow-hidden"
      style={{
        background: 'var(--bg-surface)',
        border:     isLow
          ? '1.5px solid var(--text-muted)'
          : '1px solid var(--border)',
        opacity:    visible ? 1 : 0.55,
      }}
    >
      <div className="px-3.5 pt-3.5 pb-3 flex flex-col gap-2 flex-1">

        {/* 上段: カテゴリ + 目アイコン */}
        <div className="flex items-center justify-between gap-1">
          {catName
            ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full truncate max-w-[70%]"
                    style={{ background: '#102937', color: '#ededed' }}>
                {catName}
              </span>
            : <span />
          }
          <button
            onClick={toggleVisible}
            disabled={busyV}
            title={visible ? 'メニューに表示中' : '非表示'}
            className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-all disabled:opacity-40 hover:scale-105 active:scale-95"
            style={{
              background: visible ? 'var(--bg-dark)' : 'var(--bg-base)',
              color:      visible ? 'var(--text-invert)' : 'var(--text-muted)',
              border:     visible ? 'none' : '1px solid var(--border)',
            }}
          >
            {visible ? <RiEyeFill size={11} /> : <RiEyeOffFill size={11} />}
          </button>
        </div>

        {/* 商品名 */}
        <div>
          <p className="text-[13px] font-bold leading-snug truncate" style={{ color: 'var(--text-primary)' }}>
            {product.name}
          </p>
          {product.name_en && (
            <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
              {product.name_en}
            </p>
          )}
        </div>

        {/* 発注先 */}
        {supName && (
          <p className="text-[10px] truncate font-medium" style={{ color: 'var(--text-muted)' }}>
            {supName}
          </p>
        )}

        {/* 在庫バー + 最低在庫入力 */}
        <div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: isLow ? 'var(--bg-dark)' : 'var(--text-muted)' }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5 gap-2">
            <div className="flex items-center gap-1">
              {isLow && <RiAlertFill size={10} style={{ color: 'var(--text-primary)', flexShrink: 0 }} />}
              <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                在庫 {currentQty ?? '—'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>最低</span>
              <input
                type="number"
                min="0"
                value={minInput}
                onChange={e => setMinInput(e.target.value)}
                onBlur={handleMinQtyBlur}
                onKeyDown={e => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
                disabled={busyM}
                className="w-12 px-1.5 py-0.5 rounded-md text-[10px] tabular-nums text-right outline-none disabled:opacity-50"
                style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              />
            </div>
          </div>
        </div>

        {/* 価格 */}
        <p className="text-[11px] font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
          {product.cost_price != null ? `¥${Number(product.cost_price).toLocaleString()}` : '—'}
        </p>
      </div>

      {/* フッター: 状態 + 編集 + 削除 */}
      <div
        className="grid grid-cols-3 border-t"
        style={{ borderColor: 'var(--border)' }}
      >
        <button
          onClick={toggleWaiting}
          disabled={busyW}
          className="py-2.5 text-[11px] font-semibold transition-opacity hover:opacity-70 disabled:opacity-40 border-r"
          style={{
            color:       waiting ? 'var(--text-muted)' : 'var(--text-secondary)',
            borderColor: 'var(--border)',
          }}
        >
          {waiting ? '入荷待ち' : '提供中'}
        </button>
        <Link
          href={`/admin/products/${product.id}/edit`}
          prefetch={false}
          className="flex items-center justify-center py-2.5 transition-colors hover:bg-[var(--bg-dark)] hover:text-[var(--text-invert)] border-r"
          style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}
        >
          <RiPencilFill size={13} />
        </Link>
        <button
          onClick={() => setConfirmDel(true)}
          className="flex items-center justify-center py-2.5 transition-colors hover:bg-[var(--bg-dark)] hover:text-[var(--text-invert)]"
          style={{ color: 'var(--text-muted)' }}
        >
          <RiDeleteBinFill size={13} />
        </button>
      </div>

      {/* 削除確認モーダル */}
      {confirmDel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={() => !busyDel && setConfirmDel(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-5 space-y-1.5">
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                {product.name} を削除しますか？
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                この操作は取り消せません。
              </p>
            </div>
            <div
              className="flex gap-3 px-6 py-4"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <button
                onClick={() => setConfirmDel(false)}
                disabled={busyDel}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-70 disabled:opacity-40"
                style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
              >
                キャンセル
              </button>
              <button
                onClick={async () => {
                  setBusyDel(true)
                  try { await deleteProduct(product.id) }
                  finally { setBusyDel(false); setConfirmDel(false) }
                }}
                disabled={busyDel}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ background: '#d84f2a', color: '#fff' }}
              >
                {busyDel ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
