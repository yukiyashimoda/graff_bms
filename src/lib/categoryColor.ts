/**
 * カテゴリ名からバッジ用スタイルを返すユーティリティ
 * globals.css の --category-* 変数を使用
 */
export function getCategoryStyle(name: string | null | undefined): React.CSSProperties {
  if (!name) return { background: 'rgba(129,236,255,0.12)', color: '#81ecff', border: '1px solid rgba(129,236,255,0.3)' }
  const n = name.toLowerCase()

  if (n.includes('赤ワイン') || (n.includes('ワイン') && !n.includes('白') && !n.includes('スパーク') && !n.includes('シャンパン') && !n.includes('ロゼ')))
    return { background: 'var(--category-wine-red)',   color: '#fff' }
  if (n.includes('白ワイン') || n.includes('ロゼ') || n.includes('スパークリング') || n.includes('シャンパン') || n.includes('プロセッコ'))
    return { background: 'var(--category-wine-white)', color: '#5c3e1a' }
  if (n.includes('ウイスキー') || n.includes('ウィスキー') || n.includes('バーボン') || n.includes('スコッチ'))
    return { background: 'var(--category-whiskey)',    color: '#fff' }
  if (n.includes('ウォッカ') || n.includes('ウオッカ') || n.includes('vodka'))
    return { background: 'var(--category-vodka)',      color: '#1a2835' }
  if (n.includes('ラム') || n.includes('ブランデー') || n.includes('コニャック') || n.includes('カルヴァドス'))
    return { background: 'var(--category-rum)',        color: '#fff' }
  if (n.includes('ジン') || n.includes('テキーラ') || n.includes('アガベ') || n.includes('メスカル'))
    return { background: 'var(--category-gin)',        color: '#1a3820' }
  if (n.includes('ビール') || n.includes('クラフト') || n.includes('エール'))
    return { background: 'var(--category-beer)',       color: '#3a2200' }
  if (n.includes('日本酒') || n.includes('焼酎') || n.includes('泡盛') || n.includes('清酒'))
    return { background: 'var(--category-sake)',       color: '#1a3040' }
  if (n.includes('リキュール') || n.includes('シロップ') || n.includes('コーディアル'))
    return { background: 'var(--category-liqueur)',    color: '#fff' }

  return { background: 'var(--category-other)', color: '#fff' }
}
