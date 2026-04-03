'use client'
import { RiPrinterFill } from 'react-icons/ri'
export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
      style={{ background: 'rgba(129,236,255,0.12)', color: '#81ecff', border: '1px solid rgba(129,236,255,0.3)' }}
    >
      <RiPrinterFill size={15} />
      印刷する
    </button>
  )
}
