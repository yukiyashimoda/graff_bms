'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'

export type IssuerProfile = {
  name:     string | null
  phone:    string | null
  email:    string | null
  address:  string | null
  logo_url: string | null
}

export async function getIssuerProfile(): Promise<IssuerProfile> {
  const supabase = await createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any
  const { data } = await sb
    .from('company_profile')
    .select('name, phone, email, address, logo_url')
    .eq('id', 1)
    .single()
  return {
    name:     data?.name     ?? null,
    phone:    data?.phone    ?? null,
    email:    data?.email    ?? null,
    address:  data?.address  ?? null,
    logo_url: data?.logo_url ?? null,
  }
}

export async function saveIssuerProfile(formData: FormData): Promise<{ error?: string }> {
  try {
    const supabase = await createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    const name    = (formData.get('name')    as string) || null
    const phone   = (formData.get('phone')   as string) || null
    const email   = (formData.get('email')   as string) || null
    const address = (formData.get('address') as string) || null
    const logoFile = formData.get('logo') as File | null

    let logo_url: string | null | undefined = undefined

    // ロゴ画像のアップロード
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

    // ロゴ削除フラグ
    if (formData.get('remove_logo') === '1') logo_url = null

    const update: Record<string, unknown> = {
      id: 1, name, phone, email, address,
      updated_at: new Date().toISOString(),
    }
    if (logo_url !== undefined) update.logo_url = logo_url

    const { error } = await sb.from('company_profile').upsert(update)
    if (error) return { error: error.message }

    revalidatePath('/admin/orders')
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : '保存に失敗しました' }
  }
}
