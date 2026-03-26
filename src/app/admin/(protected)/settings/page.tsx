import { getAppSettings } from './actions'
import { SettingsClient } from '@/components/admin/settings/SettingsClient'

export default async function SettingsPage() {
  const settings = await getAppSettings()

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>設定</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>アプリケーション設定</p>
      </div>
      <SettingsClient settings={settings} />
    </div>
  )
}
