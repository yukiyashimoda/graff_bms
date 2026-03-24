import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { PrintButton } from '@/components/admin/orders/PrintButton'
import { RiArrowLeftLine } from 'react-icons/ri'

export default async function OrderPrintPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServiceClient()

  const { data: order } = await supabase
    .from('purchase_orders')
    .select(`
      id, status, order_date, expected_date, notes,
      suppliers!supplier_id(name, address, contact_name, phone),
      purchase_order_items(id, quantity, products(name, unit))
    `)
    .eq('id', id)
    .single()

  if (!order) return <div className="p-8">発注書が見つかりません</div>

  const supplier = order.suppliers as unknown as {
    name: string; address: string | null; contact_name: string | null; phone: string | null
  } | null
  const items = order.purchase_order_items as unknown as {
    id: string; quantity: number; products: { name: string; unit: string }
  }[]
  const orderNo = order.id.slice(-8).toUpperCase()
  const dateStr = order.order_date

  return (
    <>
      {/* 印刷時非表示のツールバー */}
      <div
        className="print:hidden flex items-center justify-between px-6 py-3 mb-6 rounded-2xl"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <Link
          href="/admin/orders/history"
          className="flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: 'var(--text-secondary)' }}
        >
          <RiArrowLeftLine size={15} />
          発注履歴に戻る
        </Link>
        <PrintButton />
      </div>

      {/* A4 発注書 */}
      <div
        style={{
          width: '210mm',
          minHeight: '297mm',
          margin: '0 auto',
          padding: '20mm 18mm',
          background: '#fff',
          color: '#1a1a1a',
          fontFamily: '"Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif',
          fontSize: '10pt',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        }}
      >
        {/* タイトル */}
        <h1 style={{
          textAlign: 'center',
          fontSize: '22pt',
          fontWeight: 'bold',
          letterSpacing: '0.2em',
          marginBottom: '16mm',
        }}>
          発注書
        </h1>

        {/* 日付・No. */}
        <div style={{ textAlign: 'right', marginBottom: '8mm', lineHeight: '1.8' }}>
          <div>発注日　{dateStr}</div>
          {order.expected_date && <div>納品希望日　{order.expected_date}</div>}
          <div>No.　{orderNo}</div>
        </div>

        {/* 区切り線 */}
        <hr style={{ border: 'none', borderTop: '1.5px solid #1a1a1a', marginBottom: '8mm' }} />

        {/* 発注先 / 発注元 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10mm' }}>
          <div>
            <div style={{ fontSize: '14pt', fontWeight: 'bold' }}>
              {supplier?.name ?? '—'}　<span style={{ fontSize: '12pt' }}>御中</span>
            </div>
            {supplier?.address     && <div style={{ marginTop: '4mm', color: '#444', fontSize: '9pt' }}>{supplier.address}</div>}
            {supplier?.contact_name && <div style={{ color: '#444', fontSize: '9pt' }}>担当　{supplier.contact_name}</div>}
            {supplier?.phone        && <div style={{ color: '#444', fontSize: '9pt' }}>TEL　{supplier.phone}</div>}
          </div>
          <div style={{ textAlign: 'right', fontSize: '9pt', color: '#444' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11pt', color: '#1a1a1a' }}>graff.</div>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '0.5px solid #ccc', marginBottom: '8mm' }} />

        {/* 本文 */}
        <p style={{ marginBottom: '8mm' }}>下記の通り発注いたします。</p>

        {/* 明細テーブル */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
          <thead>
            <tr style={{ borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a' }}>
              <th style={{ padding: '2mm 3mm', textAlign: 'left',  width: '12mm', fontWeight: 'bold' }}>No.</th>
              <th style={{ padding: '2mm 3mm', textAlign: 'left',  fontWeight: 'bold' }}>商品名</th>
              <th style={{ padding: '2mm 3mm', textAlign: 'right', width: '20mm', fontWeight: 'bold' }}>数量</th>
              <th style={{ padding: '2mm 3mm', textAlign: 'center',width: '16mm', fontWeight: 'bold' }}>単位</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={item.id} style={{ borderBottom: '0.5px solid #ddd' }}>
                <td style={{ padding: '2.5mm 3mm', color: '#666' }}>{i + 1}</td>
                <td style={{ padding: '2.5mm 3mm' }}>{item.products.name}</td>
                <td style={{ padding: '2.5mm 3mm', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{item.quantity}</td>
                <td style={{ padding: '2.5mm 3mm', textAlign: 'center', color: '#666' }}>{item.products.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 備考 */}
        {order.notes && (
          <div style={{ marginTop: '10mm', padding: '4mm', border: '0.5px solid #ccc' }}>
            <div style={{ fontSize: '8pt', fontWeight: 'bold', marginBottom: '2mm', color: '#666' }}>備考</div>
            <div style={{ fontSize: '9pt', color: '#444' }}>{order.notes}</div>
          </div>
        )}

        {/* フッター */}
        <div style={{
          position: 'absolute',
          bottom: '15mm',
          left: '18mm',
          right: '18mm',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '7pt',
          color: '#aaa',
        }}>
          <span>graff. 統合管理システム</span>
          <span>No. {orderNo}</span>
        </div>
      </div>
    </>
  )
}
