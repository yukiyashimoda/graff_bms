'use client'

import { RiLogoutBoxLine } from 'react-icons/ri'
import { signOut } from '@/app/admin/login/actions'

export function LogoutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] w-full transition-all duration-150 hover:opacity-70"
        style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-space-grotesk, system-ui)', letterSpacing: '0.05em' }}
      >
        <RiLogoutBoxLine size={15} />
        ログアウト
      </button>
    </form>
  )
}
