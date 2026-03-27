'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'

export type AppSettings = {
  // 発注書情報
  name:     string | null
  phone:    string | null
  email:    string | null
  address:  string | null
  logo_url: string | null
  // アラート設定
  alert_threshold: number
  // 発注テキスト雛形
  order_text_template: string
}

const DEFAULT_TEMPLATE = `お世話になっております。
下記の通り発注をお願いいたします。

【注文内容】
{{items}}

{{delivery}}`

export async function getAppSettings(): Promise<AppSettings> {
  const supabase = await createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('company_profile')
    .select('name, phone, email, address, logo_url, alert_threshold, order_text_template')
    .eq('id', 1)
    .single()

  return {
    name:                data?.name     ?? null,
    phone:               data?.phone    ?? null,
    email:               data?.email    ?? null,
    address:             data?.address  ?? null,
    logo_url:            data?.logo_url ?? null,
    alert_threshold:     data?.alert_threshold     ?? 5,
    order_text_template: data?.order_text_template ?? DEFAULT_TEMPLATE,
  }
}

export async function saveIssuerProfile(formData: FormData): Promise<{ error?: string }> {
  try {
    const supabase = await createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    const name     = (formData.get('name')    as string) || null
    const phone    = (formData.get('phone')   as string) || null
    const email    = (formData.get('email')   as string) || null
    const address  = (formData.get('address') as string) || null
    const logoFile = formData.get('logo') as File | null

    let logo_url: string | null | undefined = undefined

    if (logoFile && logoFile.size > 0) {
      const ext  = logoFile.name.split('.').pop() ?? 'png'
      const path = `logos/company-logo.${ext}`
      const { error: uploadError } = await supabase.storage
        .from(process.env.STORAGE_BUCKET!)
        .upload(path, logoFile, { upsert: true })
      if (uploadError) return { error: `ロゴのアップロードに失敗しました: ${uploadError.message}` }
      const { data: urlData } = supabase.storage
        .from(process.env.STORAGE_BUCKET!)
        .getPublicUrl(path)
      logo_url = urlData.publicUrl
    }

    if (formData.get('remove_logo') === '1') logo_url = null

    const update: Record<string, unknown> = {
      id: 1, name, phone, email, address,
      updated_at: new Date().toISOString(),
    }
    if (logo_url !== undefined) update.logo_url = logo_url

    const { error } = await sb.from('company_profile').upsert(update)
    if (error) return { error: error.message }

    revalidatePath('/admin/settings')
    revalidatePath('/admin/orders')
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : '保存に失敗しました' }
  }
}

export async function saveAlertThreshold(threshold: number): Promise<{ error?: string }> {
  try {
    const supabase = await createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('company_profile')
      .upsert({ id: 1, alert_threshold: threshold, updated_at: new Date().toISOString() })
    if (error) return { error: error.message }
    revalidatePath('/admin/settings')
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : '保存に失敗しました' }
  }
}

export async function saveOrderTextTemplate(template: string): Promise<{ error?: string }> {
  try {
    const supabase = await createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('company_profile')
      .upsert({ id: 1, order_text_template: template, updated_at: new Date().toISOString() })
    if (error) return { error: error.message }
    revalidatePath('/admin/settings')
    revalidatePath('/admin/orders')
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : '保存に失敗しました' }
  }
}

// ─── 棚卸し周期設定 ─────────────────────────────────────────────────────────

export type ScheduleType = 'interval' | 'monthly_end' | 'monthly_times'

export type InventorySchedule = {
  schedule_type:  ScheduleType
  schedule_value: number | null
  interval_days:  number
}


export async function getInventorySchedule(): Promise<InventorySchedule> {
  const supabase = await createServiceClient()
  const { data } = await supabase
    .from('inventory_settings')
    .select('schedule_type, schedule_value, interval_days')
    .limit(1)
    .maybeSingle()
  return {
    schedule_type:  (data?.schedule_type  as ScheduleType | null) ?? 'interval',
    schedule_value: data?.schedule_value ?? null,
    interval_days:  data?.interval_days  ?? 30,
  }
}

export async function saveInventorySchedule(
  type: ScheduleType,
  value: number | null,
): Promise<{ error?: string }> {
  try {
    let interval_days: number
    if (type === 'monthly_end') {
      interval_days = 31
    } else if (type === 'monthly_times') {
      if (!value || value < 1) return { error: '回数を入力してください' }
      interval_days = Math.round(30 / value)
    } else {
      if (!value || value < 1) return { error: '日数を入力してください' }
      interval_days = value
    }

    const supabase = await createServiceClient()
    const { data: existing } = await supabase
      .from('inventory_settings')
      .select('id')
      .limit(1)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from('inventory_settings')
        .update({ schedule_type: type, schedule_value: value, interval_days })
        .eq('id', existing.id)
      if (error) return { error: error.message }
    } else {
      const { error } = await supabase
        .from('inventory_settings')
        .insert({ schedule_type: type, schedule_value: value, interval_days })
      if (error) return { error: error.message }
    }

    revalidatePath('/admin/settings')
    revalidatePath('/admin/inventory')
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : '保存に失敗しました' }
  }
}
