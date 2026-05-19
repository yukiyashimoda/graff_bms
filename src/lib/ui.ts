/**
 * デザイントークンを React インラインスタイル用の定数として集約。
 * CSS 変数（globals.css で定義）とブランドカラーをここだけで管理することで
 * 色の変更が全コンポーネントに自動的に反映される。
 */
import type { CSSProperties } from 'react'

export const styles = {
  card: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
  },
  input: {
    background: 'var(--bg-base)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
  },
  /** シアン系プライマリボタン（graff ブランドカラー） */
  btnPrimary: {
    background: 'rgba(129,236,255,0.12)',
    color: '#81ecff',
    border: '1px solid rgba(129,236,255,0.3)',
  },
  btnSecondary: {
    background: 'var(--bg-base)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border)',
  },
  btnDanger: {
    color: '#d84f2a',
    border: '1px solid rgba(216,79,42,0.27)',
  },
  badge: {
    warn: {
      background: 'rgba(129,236,255,0.12)',
      color: '#81ecff',
      border: '1px solid rgba(129,236,255,0.3)',
    },
    normal: {
      background: 'var(--bg-base)',
      color: 'var(--text-muted)',
      border: '1px solid var(--border)',
    },
  },
  text: {
    primary:   { color: 'var(--text-primary)'   } satisfies CSSProperties,
    secondary: { color: 'var(--text-secondary)' } satisfies CSSProperties,
    muted:     { color: 'var(--text-muted)'     } satisfies CSSProperties,
  },
  overlay: { background: 'rgba(0,0,0,0.4)' },
} as const satisfies Record<string, CSSProperties | Record<string, CSSProperties>>
