import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { AuditSheet } from '@/components/admin/inventory/AuditSheet'

export default async function InventorySessionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServiceClient()

  const { data: session } = await supabase
    .from('inventory_sessions')
    .select('id, status, started_at, submitted_at, approved_at')
    .eq('id', id)
    .single()

  if (!session) notFound()

  const { data: items } = await supabase
    .from('inventory_session_items')
    .select('id, product_id, product_name, product_name_en, unit, system_quantity, actual_quantity, notes')
    .eq('session_id', id)
    .order('product_name')

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>棚卸しシート</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          開始:{' '}
          {new Date(session.started_at).toLocaleString('ja-JP', {
            month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
          })}
        </p>
      </div>

      <AuditSheet session={session} items={items ?? []} />
    </div>
  )
}
