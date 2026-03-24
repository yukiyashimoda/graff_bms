'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// ────────────────────────────────────────────────────────
// 設定更新
// ────────────────────────────────────────────────────────
export async function updateInventorySettings(intervalDays: number) {
  const supabase = await createServiceClient()
  const { data: existing } = await supabase
    .from('inventory_settings')
    .select('id')
    .limit(1)
    .single()

  if (existing) {
    await supabase
      .from('inventory_settings')
      .update({ interval_days: intervalDays })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('inventory_settings')
      .insert({ interval_days: intervalDays })
  }
  revalidatePath('/admin/inventory')
}

// ────────────────────────────────────────────────────────
// 棚卸しセッション開始（全商品・在庫スナップショット）
// ────────────────────────────────────────────────────────
export async function createInventorySession(): Promise<{ id: string } | { error: string }> {
  const supabase = await createServiceClient()

  // 既存の進行中セッションがあれば返す
  const { data: existing } = await supabase
    .from('inventory_sessions')
    .select('id')
    .eq('status', 'in_progress')
    .limit(1)
    .maybeSingle()

  if (existing) return { id: existing.id }

  // セッション作成
  const { data: session, error: se } = await supabase
    .from('inventory_sessions')
    .insert({ status: 'in_progress' })
    .select('id')
    .single()

  if (se || !session) return { error: '作成に失敗しました' }

  // 全商品 + 在庫スナップショット取得
  const { data: products } = await supabase
    .from('products')
    .select('id, name, name_en, unit, stock(quantity)')
    .eq('is_available', true)
    .order('name')

  if (products && products.length > 0) {
    const items = products.map(p => {
      const stockRaw = p.stock as unknown
      const qty = Array.isArray(stockRaw)
        ? ((stockRaw[0] as { quantity: number } | undefined)?.quantity ?? 0)
        : ((stockRaw as { quantity: number } | null)?.quantity ?? 0)
      return {
        session_id:      session.id,
        product_id:      p.id,
        product_name:    p.name,
        product_name_en: p.name_en ?? '',
        unit:            p.unit ?? '本',
        system_quantity: qty,
        actual_quantity: null,
      }
    })
    await supabase.from('inventory_session_items').insert(items)
  }

  revalidatePath('/admin/inventory')
  return { id: session.id }
}

// ────────────────────────────────────────────────────────
// 実測値を途中保存
// ────────────────────────────────────────────────────────
export async function saveInventoryActuals(
  items: { id: string; actual_quantity: number | null; notes: string | null }[],
) {
  const supabase = await createServiceClient()
  await Promise.all(
    items.map(({ id, actual_quantity, notes }) =>
      supabase
        .from('inventory_session_items')
        .update({ actual_quantity, notes })
        .eq('id', id),
    ),
  )
  // no revalidate — client manages state
}

// ────────────────────────────────────────────────────────
// 申請（submitted に変更）
// ────────────────────────────────────────────────────────
export async function submitInventorySession(sessionId: string) {
  const supabase = await createServiceClient()
  await supabase
    .from('inventory_sessions')
    .update({ status: 'submitted', submitted_at: new Date().toISOString() })
    .eq('id', sessionId)
  revalidatePath('/admin/inventory')
  revalidatePath(`/admin/inventory/${sessionId}`)
}

// ────────────────────────────────────────────────────────
// 承認（パスワード検証 → 在庫差異を adjustment で記録）
// ────────────────────────────────────────────────────────
export async function approveInventorySession(
  sessionId: string,
  password: string,
): Promise<{ success: true } | { error: string }> {
  // 1. 現在のログインユーザーのメールを取得
  const supabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { error: 'ログインが必要です' }

  // 2. パスワード検証（セッションに影響しない独立クライアント）
  const verifyClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { error: authError } = await verifyClient.auth.signInWithPassword({
    email: user.email,
    password,
  })
  if (authError) return { error: 'パスワードが正しくありません' }

  // 3. 棚卸し品目を取得
  const { data: items } = await supabase
    .from('inventory_session_items')
    .select('product_id, system_quantity, actual_quantity')
    .eq('session_id', sessionId)

  if (!items) return { error: 'データ取得に失敗しました' }

  // 4. 差異がある商品に adjustment トランザクション記録 + 在庫更新
  const diffs = items.filter(
    i => i.actual_quantity != null && i.actual_quantity !== i.system_quantity,
  )

  if (diffs.length > 0) {
    await Promise.all([
      // stock_transactions に差異記録
      supabase.from('stock_transactions').insert(
        diffs.map(i => ({
          product_id: i.product_id,
          type:       'adjustment',
          quantity:   Number(i.actual_quantity) - Number(i.system_quantity),
          notes:      '棚卸し差異調整',
        })),
      ),
      // stock テーブルを実測値で上書き
      ...diffs.map(i =>
        supabase
          .from('stock')
          .update({ quantity: i.actual_quantity })
          .eq('product_id', i.product_id),
      ),
    ])
  }

  // 5. セッションを approved に
  await supabase
    .from('inventory_sessions')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', sessionId)

  revalidatePath('/admin/inventory')
  revalidatePath(`/admin/inventory/${sessionId}`)
  revalidatePath('/admin/stock')
  return { success: true }
}
