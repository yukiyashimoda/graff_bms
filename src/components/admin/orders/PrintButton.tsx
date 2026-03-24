'use client'
import { RiPrinterFill } from 'react-icons/ri'
export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
      style={{ background: 'var(--bg-dark)', color: 'var(--text-invert)' }}
    >
      <RiPrinterFill size={15} />
      印刷する
    </button>
  )
}
