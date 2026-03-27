import Link from 'next/link'
import { RiStoreFill, RiAlertFill, RiFileTextFill, RiCalendar2Fill, RiArrowRightSLine } from 'react-icons/ri'

const SETTINGS = [
  {
    href:        '/admin/settings/issuer',
    icon:        RiStoreFill,
    title:       '発注書情報',
    description: '会社名・電話番号・ロゴなど、発注書に印刷される情報',
  },
  {
    href:        '/admin/settings/alerts',
    icon:        RiAlertFill,
    title:       'アラート設定',
    description: '価格上昇アラートを発生させるしきい値（%）',
  },
  {
    href:        '/admin/settings/order-template',
    icon:        RiFileTextFill,
    title:       '発注テキスト雛形',
    description: '発注時のテキスト生成に使用する雛形を編集',
  },
  {
    href:        '/admin/settings/inventory-schedule',
    icon:        RiCalendar2Fill,
    title:       '次回棚卸し予定日',
    description: '棚卸しの目標日を設定してリマインド',
  },
]

export default function SettingsPage() {
  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>設定</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>アプリケーション設定</p>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        {SETTINGS.map((s, i) => (
          <Link
            key={s.href}
            href={s.href}
            className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--bg-base)]"
            style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--bg-dark)' }}
            >
              <s.icon size={17} style={{ color: 'var(--text-invert)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{s.title}</p>
              <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{s.description}</p>
            </div>
            <RiArrowRightSLine size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          </Link>
        ))}
      </div>
    </div>
  )
}
