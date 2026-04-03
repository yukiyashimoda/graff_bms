import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

// 静的解析のため明示的にインポート
const messageLoaders: Record<string, () => Promise<{ default: Record<string, unknown> }>> = {
  'ja':    () => import('../../messages/ja.json'),
  'en':    () => import('../../messages/en.json'),
  'ko':    () => import('../../messages/ko.json'),
  'zh-CN': () => import('../../messages/zh-CN.json'),
  'zh-TW': () => import('../../messages/zh-TW.json'),
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale

  if (!locale || !routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale
  }

  const loader = messageLoaders[locale] ?? messageLoaders['ja']
  const messages = (await loader()).default

  return { locale, messages }
})

type Locale = (typeof routing.locales)[number]
