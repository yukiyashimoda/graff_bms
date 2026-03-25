'use client'

import { useState } from 'react'
import { ProductsClient } from './ProductsClient'
import { GlassesClient, type GlassRow, type ProductOption } from './GlassesClient'
import { CocktailsClient, type CocktailRow } from './CocktailsClient'
import type { ProductWithRelations } from '@/lib/types/database'

type Tab = 'products' | 'glasses' | 'cocktails'

const TABS: { id: Tab; label: string }[] = [
  { id: 'products',  label: '商品一覧'     },
  { id: 'glasses',   label: 'グラス管理'   },
  { id: 'cocktails', label: 'カクテル管理' },
]

type Props = {
  products:       ProductWithRelations[]
  glasses:        GlassRow[]
  productOptions: ProductOption[]
  cocktails:      CocktailRow[]
}

export function ProductsPageClient({ products, glasses, productOptions, cocktails }: Props) {
  const [active, setActive] = useState<Tab>('products')

  return (
    <div>
      {/* タブバー */}
      <div
        className="flex w-full sm:w-fit mb-6 p-1 gap-1 rounded-2xl"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className="flex-1 sm:flex-none flex items-center justify-center px-4 h-9 rounded-xl text-sm font-semibold transition-all duration-150 whitespace-nowrap"
            style={
              active === tab.id
                ? { background: 'var(--bg-dark)', color: 'var(--text-invert)' }
                : { color: 'var(--text-secondary)' }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* パネル */}
      {active === 'products'  && <ProductsClient  products={products} />}
      {active === 'glasses'   && <GlassesClient   glasses={glasses} products={productOptions} />}
      {active === 'cocktails' && <CocktailsClient cocktails={cocktails} />}
    </div>
  )
}
