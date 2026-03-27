import { createServiceClient } from '@/lib/supabase/server'
import { InventoryMain } from '@/components/admin/inventory/InventoryMain'
import { getNextInventoryDate } from '@/app/admin/(protected)/settings/actions'

export default async function InventoryPage() {
  const supabase = await createServiceClient()

  const [
    { data: lastApproved },
    { data: activeSession },
    { data: history },
    nextInventoryDate,
  ] = await Promise.all([
    supabase
      .from('inventory_sessions')
      .select('id, approved_at')
      .eq('status', 'approved')
      .order('approved_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('inventory_sessions')
      .select('id, status, started_at, submitted_at')
      .in('status', ['in_progress', 'submitted'])
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('inventory_sessions')
      .select('id, status, started_at, approved_at')
      .eq('status', 'approved')
      .order('approved_at', { ascending: false })
      .limit(10),
    getNextInventoryDate(),
  ])

  // 予定日を過ぎているか（日付未設定なら非表示）
  const isOverdue = nextInventoryDate
    ? new Date() >= new Date(nextInventoryDate)
    : false

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>棚卸し管理</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>在庫の実地棚卸しと承認フロー</p>
      </div>

      <InventoryMain
        nextInventoryDate={nextInventoryDate}
        isOverdue={isOverdue}
        lastApprovedAt={lastApproved?.approved_at ?? null}
        activeSession={activeSession ?? null}
        history={history ?? []}
      />
    </div>
  )
}
