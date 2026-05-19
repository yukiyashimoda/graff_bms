'use client'

import { useState } from 'react'

export function useAsyncAction<T = void>(action: () => Promise<T>) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function run(): Promise<T | undefined> {
    setLoading(true)
    setError(null)
    try {
      return await action()
    } catch (e) {
      setError(e instanceof Error ? e.message : '処理に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  function clearError() { setError(null) }

  return { run, loading, error, clearError }
}
