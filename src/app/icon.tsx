import { ImageResponse } from 'next/og'

export const size        = { width: 512, height: 512 }
export const contentType = 'image/png'

async function loadDotoFont(): Promise<ArrayBuffer | null> {
  try {
    // 旧式 UA で呼ぶと Google Fonts は TTF 形式を返す（satori は woff2 非対応）
    const css = await fetch(
      'https://fonts.googleapis.com/css2?family=Doto:wght@700&display=swap',
      {
        headers: {
          'User-Agent': 'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)',
        },
      },
    ).then(r => r.text())

    // src 内の fonts.gstatic.com URL を取得
    const urls = [...css.matchAll(/url\(([^)]+)\)/g)].map(m =>
      m[1].replace(/['"]/g, ''),
    )
    const fontUrl = urls.find(u => u.includes('fonts.gstatic.com'))
    if (!fontUrl) return null
    return fetch(fontUrl).then(r => r.arrayBuffer())
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
