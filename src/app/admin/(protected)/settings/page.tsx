import { getIssuerProfile } from '@/app/admin/(protected)/orders/issuer-actions'
import { IssuerProfileForm } from '@/components/admin/settings/IssuerProfileForm'

export default async function SettingsPage() {
  const profile = await getIssuerProfile()

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>設定</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>アプリケーション設定</p>
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>発注書情報</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>発注書に印刷される会社情報・ロゴ</p>
        </div>
        <IssuerProfileForm profile={profile} />
      </section>
    </div>
  )
}
