const CHARS = 'graff.bms'.split('')

export function PageTransition() {
  return (
    <div
      style={{
        position:       'fixed',
        inset:          0,
        background:     '#ededed',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            20,
        zIndex:         9999,
        animation:      'pt-bg 0.2s ease both',
      }}
    >
      {/* g ロゴ */}
      <div
        style={{
          width:          56,
          height:         56,
          background:     '#091d26',
          borderRadius:   12,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       26,
          color:          '#ededed',
          fontFamily:     'var(--font-doto, monospace)',
          animation:      'pt-logo 0.45s cubic-bezier(0.16,1,0.3,1) 0.05s both',
        }}
      >
        g
      </div>

      {/* graff.bms テキスト */}
      <div style={{ display: 'flex', fontFamily: 'var(--font-doto, monospace)', fontSize: 18, color: '#091d26', letterSpacing: 1 }}>
        {CHARS.map((char, i) => (
          <span
            key={i}
            style={{
              display:         'inline-block',
              opacity:         0,
              animation:       'pt-char 0.35s cubic-bezier(0.16,1,0.3,1) both',
              animationDelay:  `${0.18 + i * 0.055}s`,
            }}
          >
            {char}
          </span>
        ))}
      </div>

      {/* ローディングバー */}
      <div style={{ width: 56, height: 2, background: 'rgba(9,29,38,0.12)', borderRadius: 99, overflow: 'hidden', marginTop: 4 }}>
        <div
          style={{
            height:          '100%',
            background:      '#d84f2a',
            borderRadius:    99,
            animation:       'pt-bar 0.9s cubic-bezier(0.4,0,0.2,1) 0.2s both',
          }}
        />
      </div>
    </div>
  )
}
