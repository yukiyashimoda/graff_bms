import { RiMailFill, RiLockFill, RiAlertFill } from 'react-icons/ri'
import { signIn } from './actions'

type Props = {
  searchParams: Promise<{ error?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const { error } = await searchParams

  return (
    <main
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'var(--bg-base)' }}
    >
      <div className="w-full max-w-sm space-y-6">

        {/* ロゴ */}
        <div className="flex items-center gap-3">
          <div
            className="w-[60px] h-[60px] rounded-2xl flex items-center justify-center text-xl"
            style={{ background: 'rgba(129,236,255,0.12)', color: '#81ecff', border: '1px solid rgba(129,236,255,0.3)', fontFamily: 'var(--font-doto, monospace)' }}
          >
            g
          </div>
          <div>
            <p className="text-[21px]" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-doto, monospace)' }}>
              graff.bms
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              管理パネルにログイン
            </p>
          </div>
        </div>

        {/* エラー */}
        {error === 'invalid' && (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            <RiAlertFill size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            メールアドレスまたはパスワードが正しくありません
          </div>
        )}

        {/* フォーム */}
        <form
          action={signIn}
          className="rounded-2xl p-6 space-y-4"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
              メールアドレス
            </span>
            <div className="relative">
              <RiMailFill
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                name="email"
                type="email"
                required
                placeholder="admin@example.com"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
              パスワード
            </span>
            <div className="relative">
              <RiLockFill
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </label>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98] mt-2"
            style={{ background: 'rgba(129,236,255,0.12)', color: '#81ecff', border: '1px solid rgba(129,236,255,0.3)' }}
          >
            ログイン
          </button>
        </form>

      </div>
    </main>
  )
}
