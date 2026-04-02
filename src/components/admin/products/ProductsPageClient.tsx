'use client'

import { useState } from 'react'
import { ProductsClient } from './ProductsClient'
import { GlassesClient, type GlassRow, type ProductOption } from './GlassesClient'
import { CocktailsClient, type CocktailRow } from './CocktailsClient'
import type { ProductWithRelations } from '@/lib/types/database'

type Tab = 'products' | 'glasses' | 'cocktails'

const TABS: { id: Tab; label: string }[] = [
  { id: 'products',  label: 'PRODUCTS'  },
  { id: 'glasses',   label: 'GLASSES'   },
  { id: 'cocktails', label: 'COCKTAILS' },
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
        className="filter-tabs flex w-full sm:w-fit mb-6 p-1 gap-1 rounded-xl"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className="flex-1 sm:flex-none flex items-center justify-center px-4 h-9 rounded-lg text-[13px] font-semibold transition-all duration-150 whitespace-nowrap"
            style={
              active === tab.id
                ? {
                    background:  'rgba(129, 236, 255, 0.08)',
                    color:       '#81ecff',
                    border:      '1px solid rgba(129, 236, 255, 0.2)',
                    textShadow:  '0 0 8px rgba(129,236,255,0.5)',
                    fontFamily:  'var(--font-space-grotesk, system-ui)',
                    letterSpacing: '0.08em',
                  }
                : {
                    color:       'var(--text-secondary)',
                    fontFamily:  'var(--font-space-grotesk, system-ui)',
                    letterSpacing: '0.08em',
                  }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* パネル */}
      {active === 'products'  && <ProductsClient  products={products} />}
      {active === 'glasses'   && <GlassesClient   glasses={glasses} products={productOptions} />}
      {active === 'cocktails' && <CocktailsClient cocktails={cocktails} products={productOptions} />}
    </div>
  )
}
