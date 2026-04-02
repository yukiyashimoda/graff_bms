'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  RiMore2Fill,
  RiPencilFill,
  RiDeleteBinFill,
  RiCloseFill,
  RiAlertFill,
  RiArrowDownSLine,
} from 'react-icons/ri'
import {
  updateProductAvailability,
  updateDisplayOutOfStock,
  deleteProduct,
} from '@/app/admin/(protected)/products/actions'
import { getCategoryStyle } from '@/lib/categoryColor'
import type { ProductWithRelations } from '@/lib/types/database'

function resolveStock(raw: ProductWithRelations['stock']) {
  if (!raw) return null
  return Array.isArray(raw) ? (raw[0] ?? null) : raw
}

// ── トグルスイッチ ──────────────────────────────────────────────
function ToggleSwitch({ checked, onChange, busy }: { checked: boolean; onChange: () => void; busy: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={busy}
      // btn-inline で min-height:48px を解除、borderRadius で 6px !important を上書き
      className="btn-inline relative flex-shrink-0 transition-colors disabled:opacity-50"
      style={{
        width:        44,
        height:       24,
        borderRadius: '9999px',
        background:   checked ? 'rgba(129,236,255,0.2)' : 'rgba(129,236,255,0.06)',
        border:       checked ? '1px solid rgba(129,236,255,0.4)' : '1px solid rgba(129,236,255,0.15)',
        padding:      0,
      }}
    >
      <span
        className="absolute transition-transform duration-200"
        style={{
          width:        20,
          height:       20,
          borderRadius: '9999px',
          top:          2,
          left:         2,
          background:   checked ? '#81ecff' : 'var(--text-muted)',
          transform:    checked ? 'translateX(20px)' : 'translateX(0)',
          boxShadow:    checked ? '0 0 6px rgba(129,236,255,0.6)' : 'none',
        }}
      />
    </button>
  )
}

export function ProductRow({ product }: { product: ProductWithRelations }) {
  const router   = useRouter()
  const stock    = resolveStock(product.stock)

  const [menuOpen,       setMenuOpen]       = useState(false)
  const [detailOpen,     setDetailOpen]     = useState(false)
  const [expandedDetail, setExpandedDetail] = useState(false)
  const [confirmDel,     setConfirmDel]     = useState(false)
  const [busyDel,        setBusyDel]        = useState(false)

  // switches
  const [available, setAvailable] = useState(product.is_available)
  const [visible,   setVisible]   = useState(product.display_out_of_stock)
  const [busyA,     setBusyA]     = useState(false)
  const [busyV,     setBusyV]     = useState(false)

  const catName = (product.categories as { name: string } | null)?.name
  const supName = (product.suppliers  as { name: string } | null)?.name
  const qty     = stock?.quantity   ?? null
  const minQty  = stock?.min_quantity ?? 0
  const isLow   = qty !== null && minQty > 0 && qty < minQty

  const costRate =
    product.cost_price != null && product.selling_price != null && product.selling_price > 0
      ? Math.round((product.cost_price / product.selling_price) * 1000) / 10
      : null

  const pct = minQty > 0 && qty !== null ? Math.min(100, Math.round((qty / minQty) * 100)) : 100

  function handleCardClick() {
    if (window.innerWidth < 1024) {
      setExpandedDetail(prev => !prev)
    } else {
      setDetailOpen(true)
    }
  }

  async function toggleAvailable() {
    if (busyA) return
    const next = !available
    setAvailable(next)
    setBusyA(true)
    try { await updateProductAvailability(product.id, next); router.refresh() }
    catch { setAvailable(!next) }
    finally { setBusyA(false) }
  }

  async function toggleVisible() {
    if (busyV) return
    const next = !visible
    setVisible(next)
    setBusyV(true)
    try { await updateDisplayOutOfStock(product.id, next); router.refresh() }
    catch { setVisible(!next) }
    finally { setBusyV(false) }
  }

  async function handleDelete() {
    setBusyDel(true)
    try { await deleteProduct(product.id) }
    finally { setBusyDel(false); setConfirmDel(false); setDetailOpen(false); setExpandedDetail(false) }
  }

  return (
    <>
      {/* ── カード ── */}
      <div
        className="product-card relative rounded-2xl overflow-hidden transition-all duration-200"
        style={{
          background: 'var(--bg-surface)',
          border:     isLow
            ? '1.5px solid var(--danger)'
            : expandedDetail
              ? '1px solid rgba(129,236,255,0.25)'
              : '1px solid var(--border)',
          boxShadow: expandedDetail ? '0 0 12px rgba(129,236,255,0.06)' : 'var(--shadow-sm)',
        }}
      >
        {/* ── カードヘッダー（タップ領域） ── */}
        <div
          role="button"
          tabIndex={0}
          className="w-full text-left p-4 flex flex-col gap-2 cursor-pointer"
          onClick={handleCardClick}
          onKeyDown={e => e.key === 'Enter' && handleCardClick()}
        >
          {/* カテゴリ + 展開矢印 + ケバブ */}
          <div className="flex items-center justify-between gap-2">
            {catName
              ? <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full" style={getCategoryStyle(catName)}>
                  {catName}
                </span>
              : <span />
            }
            <div className="flex items-center gap-1 flex-shrink-0">
              <RiArrowDownSLine
                size={16}
                className="lg:hidden transition-transform duration-200"
                style={{ color: 'var(--text-muted)', transform: expandedDetail ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setMenuOpen(true) }}
                className="btn-inline w-8 h-8 -mr-1 rounded-xl flex items-center justify-center transition-colors hover:bg-[var(--bg-base)] flex-shrink-0"
                style={{ color: 'var(--text-muted)' }}
              >
                <RiMore2Fill size={18} />
              </button>
            </div>
          </div>

          {/* 商品名 */}
          <p className="text-sm font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
            {product.name}
          </p>
          {product.name_en && (
            <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
              {product.name_en}
            </p>
          )}

          {/* 発注先 */}
          {supName && (
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{supName}</p>
          )}

          {/* 仕入れ値 + 在庫不足 */}
          <div className="flex items-center gap-3 pt-0.5">
            {product.cost_price != null
              ? <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                  ¥{Number(product.cost_price).toLocaleString()}
                </span>
              : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>仕入値未設定</span>
            }
            {isLow && (
              <span className="flex items-center gap-0.5 text-xs font-semibold" style={{ color: 'var(--danger)' }}>
                <RiAlertFill size={11} />
                在庫不足
              </span>
            )}
          </div>
        </div>

        {/* ── モバイル: インライン展開詳細 ── */}
        {expandedDetail && (
          <div className="lg:hidden px-4 pb-4 space-y-3" style={{ borderTop: '1px solid rgba(129,236,255,0.1)' }}>
            <div className="pt-3 space-y-2">
              {supName && <InlineRow label="発注先">{supName}</InlineRow>}
              {product.unit && <InlineRow label="単位">{product.unit}</InlineRow>}
            </div>

            {/* 在庫バー */}
            {qty !== null && (
              <div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: isLow ? 'var(--danger)' : 'rgba(129,236,255,0.4)' }}
                  />
                </div>
                <p className="text-xs mt-1.5 tabular-nums" style={{ color: isLow ? 'var(--danger)' : 'var(--text-muted)' }}>
                  在庫 {qty} {product.unit ?? '本'}
                  {minQty > 0 && ` / 最低 ${minQty}${product.unit ?? '本'}`}
                </p>
              </div>
            )}

            {/* 価格グリッド */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl p-3" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>仕入れ価格</p>
                <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  {product.cost_price != null ? `¥${Number(product.cost_price).toLocaleString()}` : '—'}
                </p>
              </div>
              <div className="rounded-xl p-3" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>販売価格</p>
                <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  {product.selling_price != null ? `¥${Number(product.selling_price).toLocaleString()}` : '—'}
                </p>
              </div>
            </div>

            {/* 原価率 */}
            {costRate !== null && (
              <div
                className="flex items-center gap-3 px-3 py-2 rounded-xl"
                style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}
              >
                <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>原価率</span>
                <span
                  className="text-base font-bold tabular-nums ml-auto"
                  style={{ color: costRate > 40 ? 'var(--danger)' : costRate > 30 ? 'var(--warning)' : 'var(--success)' }}
                >
                  {costRate}%
                </span>
              </div>
            )}

            {/* アクションボタン */}
            <div className="flex gap-2 pt-1">
              <Link
                href={`/admin/products/${product.id}/edit`}
                onClick={() => setExpandedDetail(false)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ background: 'rgba(129,236,255,0.12)', color: '#81ecff', border: '1px solid rgba(129,236,255,0.3)', textDecoration: 'none' }}
              >
                <RiPencilFill size={14} />
                編集
              </Link>
              <button
                onClick={() => { setExpandedDetail(false); setConfirmDel(true) }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger)' }}
              >
                <RiDeleteBinFill size={14} />
                削除
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── ケバブメニュー（ボトムシート） ── */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="w-full rounded-t-2xl overflow-hidden"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-muted)' }}>
                {product.name}
              </p>
            </div>

            {/* 表示/非表示 スイッチ */}
            <div
              className="flex items-center gap-3 px-5 py-4"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>メニューに表示</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {available ? '公開ページに表示中' : 'メニューから非表示（在庫の有無に関わらず）'}
                </p>
              </div>
              <ToggleSwitch checked={available} onChange={toggleAvailable} busy={busyA} />
            </div>

            {/* 入荷待ち表示 スイッチ */}
            <div
              className="flex items-center gap-3 px-5 py-4"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>入荷待ち表示</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {visible ? '在庫切れでも「入荷待ち」として公開ページに表示' : '在庫切れ時は非表示（デフォルト）'}
                </p>
              </div>
              <ToggleSwitch checked={visible} onChange={toggleVisible} busy={busyV} />
            </div>

            {/* 編集 */}
            <Link
              href={`/admin/products/${product.id}/edit`}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 w-full px-5 py-4 text-sm font-medium transition-colors hover:bg-[var(--bg-base)]"
              style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', textDecoration: 'none' }}
            >
              <RiPencilFill size={15} style={{ color: 'var(--text-muted)' }} />
              編集
            </Link>

            {/* 削除 */}
            <button
              onClick={() => { setMenuOpen(false); setConfirmDel(true) }}
              className="flex items-center gap-3 w-full px-5 py-4 text-sm font-medium transition-colors hover:bg-[var(--bg-base)]"
              style={{ color: 'var(--danger)', borderBottom: '1px solid var(--border)' }}
            >
              <RiDeleteBinFill size={15} />
              削除
            </button>

            {/* キャンセル */}
            <button
              onClick={() => setMenuOpen(false)}
              className="w-full py-4 text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ color: 'var(--text-muted)' }}
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* ── 詳細モーダル（デスクトップのみ） ── */}
      {detailOpen && (
        <div
          className="fixed inset-0 z-50 hidden lg:flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setDetailOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              {catName && (
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0"
                      style={getCategoryStyle(catName)}>
                  {catName}
                </span>
              )}
              <p className="flex-1 text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                {product.name}
              </p>
              <button
                onClick={() => setDetailOpen(false)}
                className="btn-inline p-1.5 rounded-lg hover:bg-[var(--bg-base)] flex-shrink-0"
                style={{ color: 'var(--text-muted)' }}
              >
                <RiCloseFill size={18} />
              </button>
            </div>

            {/* 詳細情報 */}
            <div className="px-5 py-4 space-y-3 overflow-y-auto" style={{ maxHeight: '55vh' }}>
              {supName && <DetailRow label="発注先">{supName}</DetailRow>}
              {product.unit && <DetailRow label="単位">{product.unit}</DetailRow>}

              {/* 在庫バー */}
              {qty !== null && (
                <div>
                  <div className="h-1.5 rounded-full overflow-hidden mb-1.5" style={{ background: 'var(--border)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: isLow ? 'var(--danger)' : 'rgba(129,236,255,0.4)' }}
                    />
                  </div>
                  <p className="text-xs tabular-nums" style={{ color: isLow ? 'var(--danger)' : 'var(--text-muted)' }}>
                    在庫 {qty} {product.unit ?? '本'}
                    {minQty > 0 && ` / 最低 ${minQty}${product.unit ?? '本'}`}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="rounded-xl p-3" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                  <p className="text-[11px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>仕入れ価格</p>
                  <p className="text-base font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                    {product.cost_price != null ? `¥${Number(product.cost_price).toLocaleString()}` : '—'}
                  </p>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                  <p className="text-[11px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>販売価格</p>
                  <p className="text-base font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                    {product.selling_price != null ? `¥${Number(product.selling_price).toLocaleString()}` : '—'}
                  </p>
                </div>
              </div>

              {costRate !== null && (
                <div
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                  style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}
                >
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>原価率</span>
                  <span
                    className="text-base font-bold tabular-nums ml-auto"
                    style={{ color: costRate > 40 ? 'var(--danger)' : costRate > 30 ? 'var(--warning)' : 'var(--success)' }}
                  >
                    {costRate}%
                  </span>
                </div>
              )}

              {/* ステータス行 */}
              <div className="flex gap-2 flex-wrap pt-1">
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: available ? 'var(--success-bg)' : 'var(--warning-bg)',
                    color:      available ? 'var(--success)'    : 'var(--warning)',
                    border:     `1px solid ${available ? 'var(--success)' : 'var(--warning)'}`,
                  }}
                >
                  {available ? '提供中' : '入荷待ち'}
                </span>
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: visible ? 'var(--info-bg)' : 'rgba(129,236,255,0.04)',
                    color:      visible ? 'var(--info)'    : 'var(--text-muted)',
                    border:     `1px solid ${visible ? 'var(--info)' : 'var(--border)'}`,
                  }}
                >
                  {visible ? '在庫切れでも表示' : '在庫切れ時非表示'}
                </span>
              </div>
            </div>

            {/* フッター */}
            <div className="flex gap-3 px-5 py-4" style={{ borderTop: '1px solid var(--border)' }}>
              <Link
                href={`/admin/products/${product.id}/edit`}
                onClick={() => setDetailOpen(false)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ background: 'rgba(129,236,255,0.12)', color: '#81ecff', border: '1px solid rgba(129,236,255,0.3)', textDecoration: 'none' }}
              >
                <RiPencilFill size={14} />
                編集
              </Link>
              <button
                onClick={() => { setDetailOpen(false); setConfirmDel(true) }}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger)' }}
              >
                <RiDeleteBinFill size={14} />
                削除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 削除確認 ── */}
      {confirmDel && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => !busyDel && setConfirmDel(false)}
        >
          <div
            className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-5 space-y-1.5">
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                {product.name} を削除しますか？
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>この操作は取り消せません。</p>
            </div>
            <div className="flex gap-3 px-6 py-4" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => setConfirmDel(false)}
                disabled={busyDel}
                className="flex-1 py-3 rounded-xl text-sm font-medium transition-opacity hover:opacity-70 disabled:opacity-40"
                style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                disabled={busyDel}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ background: 'var(--danger)', color: 'white' }}
              >
                {busyDel ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── 共通 UI ────────────────────────────────────────────────────────────────

function InlineRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-14 flex-shrink-0 text-[10px] font-semibold pt-0.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <span className="flex-1 text-xs" style={{ color: 'var(--text-primary)' }}>
        {children}
      </span>
    </div>
  )
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-16 flex-shrink-0 text-xs font-semibold pt-0.5" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <span className="flex-1 text-sm" style={{ color: 'var(--text-primary)' }}>
        {children}
      </span>
    </div>
  )
}
