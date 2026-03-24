'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'

export async function markAlertRead(id: string) {
  const supabase = await createServiceClient()
  await supabase.from('price_alerts').update({ is_read: true }).eq('id', id)
  revalidatePath('/admin/alerts')
  revalidatePath('/admin')
}

export async function markAllAlertsRead() {
  const supabase = await createServiceClient()
  await supabase.from('price_alerts').update({ is_read: true }).eq('is_read', false)
  revalidatePath('/admin/alerts')
  revalidatePath('/admin')
}
