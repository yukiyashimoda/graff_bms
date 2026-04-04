import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['ja', 'en', 'ko', 'zh-CN', 'zh-TW'],
  defaultLocale: 'ja',
  localeDetection: false,
})

export type Locale = (typeof routing.locales)[number]
