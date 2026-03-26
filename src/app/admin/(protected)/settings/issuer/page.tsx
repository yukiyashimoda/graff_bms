import Link from 'next/link'
import { RiArrowLeftSLine } from 'react-icons/ri'
import { getAppSettings } from '../actions'
import { IssuerForm } from '@/components/admin/settings/IssuerForm'

export default async function IssuerSettingsPage() {
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
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>発注書情報</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>発注書に印刷される会社情報・ロゴ</p>
      </div>
      <IssuerForm settings={settings} />
    </div>
  )
}
