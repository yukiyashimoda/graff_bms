'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'

export async function createSupplier(formData: FormData) {
  const supabase = await createServiceClient()

  await supabase.from('suppliers').insert({
    name:         formData.get('name')         as string,
    name_en:      (formData.get('name_en')      as string) || '',
    contact_name: (formData.get('contact_name') as string) || null,
    phone:        (formData.get('phone')         as string) || null,
    address:      (formData.get('address')       as string) || null,
    notes:        (formData.get('notes')         as string) || null,
  })

  revalidatePath('/admin/suppliers')
}

export async function updateSupplier(id: string, formData: FormData) {
  const supabase = await createServiceClient()

  await supabase.from('suppliers').update({
    name:         formData.get('name')         as string,
    name_en:      (formData.get('name_en')      as string) || '',
    contact_name: (formData.get('contact_name') as string) || null,
    phone:        (formData.get('phone')         as string) || null,
    address:      (formData.get('address')       as string) || null,
    notes:        (formData.get('notes')         as string) || null,
  }).eq('id', id)

  revalidatePath('/admin/suppliers')
  revalidatePath('/admin/products')
}

export async function deleteSupplier(id: string) {
  const supabase = await createServiceClient()
  await supabase.from('suppliers').delete().eq('id', id)
  revalidatePath('/admin/suppliers')
  revalidatePath('/admin/products')
}
