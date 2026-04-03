import { ImageResponse } from 'next/og'
import { readFile } from 'fs/promises'
import path from 'path'

export const size        = { width: 512, height: 512 }
export const contentType = 'image/png'

export default async function Icon() {
  const fontData = await readFile(
    path.join(process.cwd(), 'public/fonts/Doto-Bold.ttf'),
  )

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
          fontFamily: 'Doto',
          fontWeight: 700,
          display:    'flex',
          lineHeight: 1,
          marginTop:  32,
        }}
      >
        g
      </div>
    </div>,
    {
      ...size,
      fonts: [{ name: 'Doto', data: fontData, weight: 700, style: 'normal' }],
    },
  )
}
