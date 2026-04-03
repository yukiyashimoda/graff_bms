import { ImageResponse } from 'next/og'

export const size        = { width: 512, height: 512 }
export const contentType = 'image/png'

async function loadDotoFont(): Promise<ArrayBuffer | null> {
  try {
    // Google Fonts CSS から woff2 URL を取得
    const css = await fetch(
      'https://fonts.googleapis.com/css2?family=Doto:wght@700&display=swap',
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      },
    ).then(r => r.text())

    const match = css.match(/src:\s*url\(([^)]+\.woff2)\)/)
    if (!match) return null
    return fetch(match[1]).then(r => r.arrayBuffer())
  } catch {
    return null
  }
}

export default async function Icon() {
  const fontData = await loadDotoFont()

  return new ImageResponse(
    <div
      style={{
        width:           '100%',
        height:          '100%',
        background:      '#080f16',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        borderRadius:    96,
        position:        'relative',
      }}
    >
      {/* 外枠 glow */}
      <div
        style={{
          position:     'absolute',
          inset:        0,
          borderRadius: 96,
          border:       '5px solid rgba(129,236,255,0.25)',
          display:      'flex',
        }}
      />
      {/* "g" */}
      <div
        style={{
          fontSize:   290,
          color:      '#81ecff',
          fontFamily: fontData ? 'Doto' : 'monospace',
          fontWeight: 700,
          display:    'flex',
          lineHeight: 1,
          marginTop:  32,
          textShadow: '0 0 60px rgba(129,236,255,0.6)',
        }}
      >
        g
      </div>
    </div>,
    {
      ...size,
      fonts: fontData
        ? [{ name: 'Doto', data: fontData, weight: 700, style: 'normal' }]
        : [],
    },
  )
}
