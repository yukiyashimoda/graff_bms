import { createServiceClient } from '@/lib/supabase/server'
import { InventoryMain } from '@/components/admin/inventory/InventoryMain'

export default async function InventoryPage() {
  const supabase = await createServiceClient()

  // 設定
  const { data: settings } = await supabase
    .from('inventory_settings')
    .select('interval_days')
    .limit(1)
    .maybeSingle()

  // 最後に承認されたセッション
  const { data: lastApproved } = await supabase
    .from('inventory_sessions')
    .select('id, approved_at')
    .eq('status', 'approved')
    .order('approved_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // 進行中 / 申請中セッション
  const { data: activeSession } = await supabase
    .from('inventory_sessions')
    .select('id, status, started_at, submitted_at')
    .in('status', ['in_progress', 'submitted'])
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // 過去セッション一覧（承認済み、最新10件）
  const { data: history } = await supabase
    .from('inventory_sessions')
    .select('id, status, started_at, approved_at')
    .eq('status', 'approved')
    .order('approved_at', { ascending: false })
    .limit(10)

  const intervalDays = settings?.interval_days ?? 30

  // アラート判定：前回承認から interval_days 日を超えているか
  const isOverdue = (() => {
    if (!lastApproved?.approved_at) return true
    const last = new Date(lastApproved.approved_at)
    const diff = (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24)
    return diff > intervalDays
  })()

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>棚卸し管理</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>在庫の実地棚卸しと承認フロー</p>
      </div>

      <InventoryMain
        intervalDays={intervalDays}
        isOverdue={isOverdue}
        lastApprovedAt={lastApproved?.approved_at ?? null}
        activeSession={activeSession ?? null}
        history={history ?? []}
      />
    </div>
  )
}
