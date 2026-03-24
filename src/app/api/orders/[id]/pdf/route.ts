// eslint-disable-next-line @typescript-eslint/no-require-imports
const { renderToBuffer } = require('@react-pdf/renderer') as {
  renderToBuffer: (element: React.ReactElement) => Promise<Buffer>
}
import React from 'react'
import { createServiceClient } from '@/lib/supabase/server'
import { PurchaseOrderDocument } from '@/components/pdf/PurchaseOrderDocument'
import type { PurchaseOrderWithDetails } from '@/lib/types/database'

export const runtime = 'nodejs'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from('purchase_orders')
    .select(`
      *,
      suppliers(*),
      purchase_order_items(*, products(*))
    `)
    .eq('id', id)
    .single()

  if (error || !data) {
    return new Response('Not found', { status: 404 })
  }

  const order = data as unknown as PurchaseOrderWithDetails

  const buffer: Buffer = await renderToBuffer(
    React.createElement(PurchaseOrderDocument, { order }),
  )

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="order-${id.slice(-8).toUpperCase()}.pdf"`,
    },
  })
}
