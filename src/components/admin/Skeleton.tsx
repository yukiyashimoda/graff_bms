function Skel({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl ${className}`}
      style={{ background: 'var(--border)', opacity: 0.5 }}
    />
  )
}

/** 商品・発注・入出庫カードグリッド用 */
export function CardGridSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skel className="h-6 w-28" />
          <Skel className="h-3 w-12" />
        </div>
        <Skel className="h-10 w-28" />
      </div>
      <div className="flex gap-2">
        <Skel className="h-11 flex-1" />
        <Skel className="h-11 w-24" />
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))' }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <Skel key={i} className="h-52" />
        ))}
      </div>
    </div>
  )
}

/** 入出庫・発注履歴など横行テーブル用 */
export function TableRowsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Skel className="h-6 w-24" />
        <Skel className="h-3 w-16" />
      </div>
      <div className="flex gap-2">
        <Skel className="h-11 flex-1" />
        <Skel className="h-11 w-20" />
        <Skel className="h-11 w-20" />
        <Skel className="h-11 w-20" />
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-5 py-4"
            style={{ borderBottom: i < 7 ? '1px solid var(--border)' : 'none' }}
          >
            <Skel className="h-4 w-28 flex-shrink-0" />
            <Skel className="h-4 w-14 flex-shrink-0" />
            <Skel className="h-4 flex-1" />
            <Skel className="h-4 w-16 flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** 発注履歴カードリスト用 */
export function OrderCardsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Skel className="h-6 w-24" />
        <Skel className="h-3 w-16" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skel key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

/** 発注先・原価計算 2カラムカードグリッド用 */
export function TwoColCardsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skel className="h-6 w-28" />
          <Skel className="h-3 w-10" />
        </div>
        <Skel className="h-10 w-28" />
      </div>
      <div className="flex gap-2 flex-wrap">
        <Skel className="h-11 flex-1 min-w-40" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skel key={i} className="h-11 w-20" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skel key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

/** 棚卸し管理用 */
export function InventorySkeleton() {
  return (
    <div className="max-w-4xl space-y-5">
      <div className="space-y-1">
        <Skel className="h-6 w-28" />
        <Skel className="h-3 w-40" />
      </div>
      <Skel className="h-24 rounded-2xl" />
      <Skel className="h-32 rounded-2xl" />
      <Skel className="h-48 rounded-2xl" />
    </div>
  )
}
