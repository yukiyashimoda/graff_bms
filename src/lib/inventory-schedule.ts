import type { InventorySchedule } from '@/app/admin/(protected)/settings/actions'

export function scheduleLabel(s: InventorySchedule): string {
  if (s.schedule_type === 'monthly_end')   return '月末'
  if (s.schedule_type === 'monthly_times') return `月${s.schedule_value ?? 1}回`
  return `${s.interval_days}日ごと`
}
