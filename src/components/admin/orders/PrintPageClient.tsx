'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { RiArrowLeftLine } from 'react-icons/ri'
import { PrintButton } from './PrintButton'

const BRAND = '#3a8b9d'
const BRAND_LIGHT = '#d8e9ed'
const MIN_ROWS = 12

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${y}年${Number(m)}月${Number(d)}日`
}

type Supplier = {
  name: string
  address: string | null
  contact_name: string | null
  phone: string | null
}

type Item = {
  id: string
  quantity: number
  products: { name: string; unit: string }
}

type Order = {
  id: string
  order_date: string
  expected_date: string | null
  notes: string | null
  supplier: Supplier | null
  items: Item[]
}

type IssuerProfile = {
  name: string | null
  address: string | null
  phone: string | null
  email: string | null
  logo_url: string | null
}

export function PrintPageClient({
  order,
  issuer,
}: {
  order: Order
  issuer: IssuerProfile
}) {
  const orderNo = order.id.slice(-8).toUpperCase()
  const emptyRows = Math.max(0, MIN_ROWS - order.items.length)

  useEffect(() => {
    const outer = document.querySelector<HTMLElement>('.a4-outer')
    if (!outer) return
    function setScale() {
      const w = outer!.clientWidth
      if (w < 794) {
        const scale = w / 794
        outer!.style.height = Math.round(1123 * scale) + 'px'
        const doc = outer!.querySelector<HTMLElement>('.a4-doc')
        if (doc) doc.style.transform = `scale(${scale.toFixed(4)})`
      } else {
        outer!.style.height = ''
        const doc = outer!.querySelector<HTMLElement>('.a4-doc')
        if (doc) doc.style.transform = ''
      }
    }
    setScale()
    window.addEventListener('resize', setScale)
    return () => window.removeEventListener('resize', setScale)
  }, [order])

  return (
    <>
      {/* 印刷時非表示のツールバー */}
      <div
        className="print:hidden flex items-center justify-between px-6 py-3 mb-6 rounded-2xl"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <Link
          href="/admin/orders"
          className="flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: 'var(--text-secondary)' }}
        >
          <RiArrowLeftLine size={15} />
          検品画面に戻る
        </Link>
        <PrintButton />
      </div>

      <style>{`
        .scanline-overlay, .noise-overlay { display: none !important; }
        .a4-outer {
          width: 100%;
          overflow: hidden;
        }
        .a4-doc {
          font-family: "Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif;
          color: #333;
          width: 794px;
          min-height: 1123px;
          padding: 20mm;
          margin: 0 auto;
          background: #fff;
          font-size: 10pt;
          box-shadow: 0 4px 24px rgba(0,0,0,0.12);
          box-sizing: border-box;
          transform-origin: top left;
        }
        @media print {
          .a4-outer { height: auto !important; overflow: visible !important; }
          body { background: none !important; }
          .a4-doc {
            width: 210mm !important;
            min-height: 297mm !important;
            padding: 20mm !important;
            box-shadow: none !important;
            transform: none !important;
          }
          .a4-title-banner { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .a4-th           { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* A4 発注書 */}
      <div className="a4-outer">
        <div className="a4-doc">
          {/* 伝票番号・日付（右上） */}
          <div style={{ textAlign: 'right', fontSize: '12px', lineHeight: '1.8', marginBottom: '16px', color: '#555' }}>
            <div>発行日：{formatDate(order.order_date)}</div>
            {order.expected_date && <div>納品希望日：{formatDate(order.expected_date)}</div>}
            <div>伝票番号：{orderNo}</div>
          </div>

          {/* タイトルバナー */}
          <div
            className="a4-title-banner"
            style={{
              background: BRAND,
              color: '#fff',
              padding: '10px 16px',
              fontSize: '26px',
              fontWeight: 'bold',
              letterSpacing: '1em',
              marginBottom: '28px',
            }}
          >
            発注書
          </div>

          {/* 発注先 / 発注元 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px' }}>

            {/* 発注先（左） */}
            <div style={{ width: '55%' }}>
              {order.supplier?.address && (
                <div style={{ fontSize: '12px', color: '#555', marginBottom: '6px', lineHeight: '1.6' }}>
                  {order.supplier.address}
                </div>
              )}
              {order.supplier?.contact_name && (
                <div style={{ fontSize: '12px', color: '#555', marginBottom: '6px' }}>
                  担当：{order.supplier.contact_name}
                </div>
              )}
              <div style={{
                fontSize: '18px',
                fontWeight: 'bold',
                borderBottom: `2px solid ${BRAND}`,
                paddingBottom: '5px',
                display: 'inline-block',
                width: '100%',
              }}>
                {order.supplier?.name ?? '—'}　御中
              </div>
            </div>

            {/* 発注元（右） */}
            <div style={{ width: '40%', textAlign: 'right', fontSize: '12px', lineHeight: '1.7', color: '#555' }}>
              {issuer.logo_url && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                  <div style={{ position: 'relative', width: '100px', height: '48px' }}>
                    <Image
                      src={issuer.logo_url}
                      alt="logo"
                      fill
                      style={{ objectFit: 'contain', objectPosition: 'right' }}
                    />
                  </div>
                </div>
              )}
              {issuer.name ? (
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#333', marginBottom: '2px' }}>
                  {issuer.name}
                </div>
              ) : (
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#333', marginBottom: '2px' }}>
                  graff.
                </div>
              )}
              {issuer.address && <div style={{ whiteSpace: 'pre-line' }}>{issuer.address}</div>}
              {issuer.phone   && <div>TEL：{issuer.phone}</div>}
              {issuer.email   && <div>{issuer.email}</div>}
            </div>
          </div>

          {/* 本文 */}
          <p style={{ fontSize: '13px', marginBottom: '16px', color: '#333' }}>
            下記の通り発注いたします。
          </p>

          {/* 明細テーブル */}
          <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${BRAND}` }}>
            <thead>
              <tr>
                <th
                  className="a4-th"
                  style={{ background: BRAND_LIGHT, border: `1px solid ${BRAND}`, padding: '10px', fontSize: '13px', textAlign: 'left', width: '75%' }}
                >
                  商品名
                </th>
                <th
                  className="a4-th"
                  style={{ background: BRAND_LIGHT, border: `1px solid ${BRAND}`, padding: '10px', fontSize: '13px', textAlign: 'center', width: '25%' }}
                >
                  数量
                </th>
              </tr>
            </thead>
            <tbody>
              {order.items.map(item => (
                <tr key={item.id}>
                  <td style={{ border: `1px solid ${BRAND}`, padding: '10px', fontSize: '13px', height: '36px' }}>
                    {item.products.name}
                  </td>
                  <td style={{ border: `1px solid ${BRAND}`, padding: '10px', fontSize: '13px', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                    {item.quantity} {item.products.unit}
                  </td>
                </tr>
              ))}
              {Array.from({ length: emptyRows }).map((_, i) => (
                <tr key={`empty-${i}`}>
                  <td style={{ border: `1px solid ${BRAND}`, padding: '10px', height: '36px' }}> </td>
                  <td style={{ border: `1px solid ${BRAND}`, padding: '10px', height: '36px' }}> </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 備考 */}
          {order.notes && (
            <div style={{ marginTop: '20px', padding: '10px 12px', border: `1px solid ${BRAND}` }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '6px', color: '#555' }}>備考</div>
              <div style={{ fontSize: '12px', color: '#444', lineHeight: '1.6' }}>{order.notes}</div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
