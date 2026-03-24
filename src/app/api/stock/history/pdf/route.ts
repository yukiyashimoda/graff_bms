// eslint-disable-next-line @typescript-eslint/no-require-imports
const { renderToBuffer } = require('@react-pdf/renderer') as {
  renderToBuffer: (element: React.ReactElement) => Promise<Buffer>
}
import React from 'react'
import { createServiceClient } from '@/lib/supabase/server'
import { StockHistoryDocument } from '@/components/pdf/StockHistoryDocument'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month') // "YYYY-MM"

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return new Response('month parameter required (YYYY-MM)', { status: 400 })
  }

  const supabase = await createServiceClient()

  const from = `${month}-01T00:00:00.000Z`
  const [y, m] = month.split('-').map(Number)
  const nextMonth = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
  const to = `${nextMonth}-01T00:00:00.000Z`

  const { data: transactions, error } = await supabase
    .from('stock_transactions')
    .select(`id, type, quantity, cost_price, notes, created_at, products(name, name_en, unit)`)
    .gte('created_at', from)
    .lt('created_at', to)
    .order('created_at', { ascending: true })

  if (error) {
    return new Response('Failed to fetch data', { status: 500 })
  }

  const rows = (transactions ?? []).map(t => {
    const p = t.products as unknown as { name: string; name_en: string; unit: string } | null
    return {
      id:              t.id,
      type:            t.type as 'in' | 'out' | 'adjustment',
      quantity:        Number(t.quantity),
      cost_price:      t.cost_price != null ? Number(t.cost_price) : null,
      notes:           t.notes,
      created_at:      t.created_at,
      product_name:    p?.name    ?? '—',
      product_name_en: p?.name_en ?? '',
      unit:            p?.unit    ?? '',
    }
  })

  const buffer: Buffer = await renderToBuffer(
    React.createElement(StockHistoryDocument, { transactions: rows, month }),
  )

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="stock-history-${month}.pdf"`,
    },
  })
}
