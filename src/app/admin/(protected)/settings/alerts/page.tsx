import Link from 'next/link'
import { RiArrowLeftSLine } from 'react-icons/ri'
import { getAppSettings } from '../actions'
import { AlertThresholdForm } from '@/components/admin/settings/AlertThresholdForm'

export default async function AlertSettingsPage() {
  const settings = await getAppSettings()
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
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>アラート設定</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>価格上昇アラートのしきい値を設定します</p>
      </div>
      <AlertThresholdForm settings={settings} />
    </div>
  )
}
