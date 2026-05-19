/**
 * revalidatePath の組み合わせを Server Actions 間で共有するユーティリティ。
 * 新しいロケールを追加する際もここだけを修正すれば全体に反映される。
 */
import { revalidatePath } from 'next/cache'

/** 顧客向けメニューページを全ロケール再検証 */
export function revalidateMenu() {
  revalidatePath('/ja', 'page')
  revalidatePath('/en', 'page')
}

/** 在庫関連ページを再検証 */
export function revalidateStock() {
  revalidatePath('/admin/stock')
  revalidatePath('/admin')
  revalidateMenu()
}

/** 商品マスタ関連ページを再検証 */
export function revalidateProducts() {
  revalidatePath('/admin/products')
  revalidateMenu()
}

/** 発注関連ページを再検証 */
export function revalidateOrders() {
  revalidatePath('/admin/orders')
  revalidatePath('/admin/orders/history')
}
