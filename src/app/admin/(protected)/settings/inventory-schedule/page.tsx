import Link from 'next/link'
import { RiArrowLeftSLine } from 'react-icons/ri'
import { getNextInventoryDate } from '../actions'
import { InventoryScheduleForm } from '@/components/admin/settings/InventoryScheduleForm'

export default async function InventorySchedulePage() {
  const nextDate = await getNextInventoryDate()
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
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>次回棚卸し予定日</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>棚卸しの目標日を設定してリマインドを受け取る</p>
      </div>
      <InventoryScheduleForm nextDate={nextDate} />
    </div>
  )
}
