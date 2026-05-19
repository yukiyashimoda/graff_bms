'use client'

import { useState } from 'react'

export function useToast(durationMs = 4000) {
  const [message, setMessage] = useState<string | null>(null)

  function show(msg: string) {
    setMessage(msg)
    setTimeout(() => setMessage(null), durationMs)
  }

  return { message, show }
}
