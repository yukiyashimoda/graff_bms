/** 価格・日付・比率など表示用フォーマット関数を一元管理 */

export function formatPrice(price: number | null | undefined): string {
  if (price == null) return '—'
  return `¥${price.toLocaleString('ja-JP')}`
}

export function formatQuantity(qty: number, unit: string): string {
  return `${qty} ${unit}`
}

/**
 * 原価率を計算して小数点1桁で返す。
 * 販売価格が 0 または未入力の場合は null。
 */
export function calcCostRate(cost: number, selling: number): number | null {
  if (!cost || !selling || selling === 0) return null
  return Math.round((cost / selling) * 1000) / 10
}

/** ISO 文字列または Date を "YYYY/MM/DD" 形式に変換 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

/** ISO 文字列を "YYYY/MM/DD HH:mm" 形式に変換 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}
