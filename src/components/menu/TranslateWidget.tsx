'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'

declare global {
  interface Window {
    googleTranslateElementInit?: () => void
    google?: {
      translate: {
        TranslateElement: new (options: object, id: string) => void
      }
    }
  }
}

const LANGS = [
  { code: 'ja',    label: 'JA' },
  { code: 'en',    label: 'EN' },
  { code: 'ko',    label: 'KO' },
  { code: 'zh-CN', label: '简' },
  { code: 'zh-TW', label: '繁' },
] as const

export function TranslateWidget() {
  const locale = useLocale()
  const [active, setActive] = useState(locale)

  useEffect(() => {
    // Google のツールバーを非表示
    const style = document.createElement('style')
    style.id = '__gt_hide'
    style.textContent = `
      .goog-te-banner-frame, .goog-te-balloon-frame,
      #goog-gt-tt, .goog-te-ftab-float { display: none !important; }
      body { top: 0 !important; }
      .skiptranslate > iframe { height: 0 !important; border: none !important; }
    `
    document.head.appendChild(style)

    window.googleTranslateElementInit = () => {
      if (window.google?.translate) {
        new window.google.translate.TranslateElement(
          { pageLanguage: 'ja', autoDisplay: false },
          'google_translate_element',
        )
      }
    }

    const script = document.createElement('script')
    script.id = '__gt_script'
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.getElementById('__gt_hide')?.remove()
      document.getElementById('__gt_script')?.remove()
    }
  }, [])

  function switchTo(lang: string) {
    setActive(lang)

    if (lang === 'ja') {
      // googtrans クッキーを削除して /ja/... へ遷移
      const clear = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`
      document.cookie = clear
      document.cookie = `${clear}; domain=.${window.location.hostname}`
      // URL の最初のセグメント（ロケール）を 'ja' に置換
      const segments = window.location.pathname.split('/')
      segments[1] = 'ja'
      window.location.href = segments.join('/')
      return
    }

    // Google Translate の内部 <select> を操作
    const attempt = (tries = 15) => {
      const combo = document.querySelector<HTMLSelectElement>('.goog-te-combo')
      if (combo) {
        combo.value = lang
        combo.dispatchEvent(new Event('change'))
      } else if (tries > 0) {
        setTimeout(() => attempt(tries - 1), 200)
      }
    }
    attempt()
  }

  return (
    <>
      {/* Google Translate のマウント先（非表示） */}
      <div id="google_translate_element" style={{ display: 'none' }} />

      {/* カスタムボタン群 */}
      <div className="flex items-center gap-0.5">
        {LANGS.map(({ code, label }) => {
          const isActive = active === code
          return (
            <button
              key={code}
              onClick={() => switchTo(code)}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all"
              style={{
                background: isActive ? '#111' : 'transparent',
                color:      isActive ? '#fff' : '#999',
                border:     isActive ? '1px solid #111' : '1px solid transparent',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>
    </>
  )
}
