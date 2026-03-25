'use client'

import { Tabs, TabList, Tab, TabPanel } from '@heroui/react'
import { ProductsClient } from './ProductsClient'
import { GlassesClient, type GlassRow } from './GlassesClient'
import { CocktailsClient, type CocktailRow } from './CocktailsClient'
import type { ProductWithRelations } from '@/lib/types/database'

type Props = {
  products:  ProductWithRelations[]
  glasses:   GlassRow[]
  cocktails: CocktailRow[]
}

const tabListClass = [
  'flex gap-1 p-1 rounded-2xl w-fit mb-6',
  'bg-[var(--bg-surface)]',
  'border border-[var(--border)]',
].join(' ')

const tabClass = [
  'px-4 h-9 rounded-xl text-sm font-semibold cursor-pointer outline-none',
  'transition-all duration-150',
  'text-[var(--text-secondary)]',
  'hover:bg-[var(--bg-base)]',
  'data-[selected]:bg-[var(--bg-dark)]',
  'data-[selected]:text-[var(--text-invert)]',
  'data-[selected]:hover:bg-[var(--bg-dark)]',
].join(' ')

export function ProductsPageClient({ products, glasses, cocktails }: Props) {
  return (
    <Tabs>
      <TabList className={tabListClass}>
        <Tab id="products" className={tabClass}>商品一覧</Tab>
        <Tab id="glasses"  className={tabClass}>グラス管理</Tab>
        <Tab id="cocktails" className={tabClass}>カクテル管理</Tab>
      </TabList>

      <TabPanel id="products" className="outline-none">
        <ProductsClient products={products} />
      </TabPanel>
      <TabPanel id="glasses" className="outline-none">
        <GlassesClient glasses={glasses} />
      </TabPanel>
      <TabPanel id="cocktails" className="outline-none">
        <CocktailsClient cocktails={cocktails} />
      </TabPanel>
    </Tabs>
  )
}
