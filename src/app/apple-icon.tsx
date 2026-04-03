import { ImageResponse } from 'next/og'
import { readFile } from 'fs/promises'
import path from 'path'

export const size        = { width: 180, height: 180 }
export const contentType = 'image/png'

export default async function AppleIcon() {
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
      }}
    >
      <div
        style={{
          fontSize:   108,
          color:      '#81ecff',
          fontFamily: 'Doto',
          fontWeight: 700,
          display:    'flex',
          lineHeight: 1,
          marginTop:  12,
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
