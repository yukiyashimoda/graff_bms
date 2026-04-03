import Link from 'next/link'
import { RiArrowLeftLine } from 'react-icons/ri'
import { getCategories } from './actions'
import { CategoryManager } from '@/components/admin/settings/CategoryManager'

export default async function CategoriesPage() {
  const categories = await getCategories()

  return (
    <div className="max-w-lg space-y-4 pb-24">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/settings"
          className="p-2 rounded-xl hover:bg-[var(--bg-surface)]"
          style={{ color: 'var(--text-muted)' }}
        >
          <RiArrowLeftLine size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>カテゴリ管理</h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            大カテゴリーとサブカテゴリーを自由に追加・削除できます。
          </p>
        </div>
      </div>

      <CategoryManager initialCategories={categories} />
    </div>
  )
}
