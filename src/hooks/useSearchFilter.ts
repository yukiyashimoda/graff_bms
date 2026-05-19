'use client'

import { useState, useMemo } from 'react'

export function useSearchFilter<T>(
  items: T[],
  predicate: (item: T, query: string) => boolean,
) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(
    () => (!query ? items : items.filter(i => predicate(i, query.toLowerCase()))),
    // predicate は呼び出し側で useCallback に包んで渡す想定
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, query],
  )

  return { query, setQuery, filtered }
}
