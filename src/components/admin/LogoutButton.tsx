'use client'

import { RiLogoutBoxLine } from 'react-icons/ri'
import { signOut } from '@/app/admin/login/actions'

export function LogoutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] w-full transition-colors hover:bg-black/5"
        style={{ color: 'var(--text-muted)' }}
      >
        <RiLogoutBoxLine size={15} />
        ログアウト
      </button>
    </form>
  )
}
