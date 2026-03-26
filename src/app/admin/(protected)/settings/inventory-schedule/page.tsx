import Link from 'next/link'
import { RiArrowLeftSLine } from 'react-icons/ri'
import { getInventorySchedule } from '../actions'
import { InventoryScheduleForm } from '@/components/admin/settings/InventoryScheduleForm'

export default async function InventorySchedulePage() {
  const schedule = await getInventorySchedule()
  return (
    <div className="max-w-lg space-y-5">
      <div className="flex items-center gap-2">
        <Link
          href="/admin/settings"
          className="flex items-center gap-1 text-sm transition-opacity hover:opacity-70"
          style={{ color: 'var(--text-muted)' }}
        >
          <RiArrowLeftSLine size={16} />
          設定
        </Link>
      </div>
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>棚卸し周期設定</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>棚卸しを行う頻度・タイミングを設定します</p>
      </div>
      <InventoryScheduleForm schedule={schedule} />
    </div>
  )
}
