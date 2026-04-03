const CACHE = 'graff-bms-v1'

// /_next/static/ は content-hash 付きなので immutable として cache-first
const STATIC_RE = /^\/_next\/static\//
// フォント・画像も cache-first
const ASSET_RE  = /\.(woff2?|ttf|otf|png|jpg|jpeg|webp|svg|ico)(\?.*)?$/i

// ───────────────────────────── install ─────────────────────────────
self.addEventListener('install', () => self.skipWaiting())

// ───────────────────────────── activate ────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

// ───────────────────────────── fetch ───────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // 外部リクエスト・Supabase API はスキップ
  if (url.origin !== self.location.origin) return

  // Static assets: cache-first（ハッシュ付きで永続キャッシュ）
  if (STATIC_RE.test(url.pathname) || ASSET_RE.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached
        return fetch(request).then(res => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE).then(c => c.put(request, clone))
          }
          return res
        })
      })
    )
    return
  }

  // ナビゲーション（HTML ページ）: network-first、失敗時はオフラインページ
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/offline.html').then(r => r ?? new Response(
          '<!doctype html><html><body style="background:#080f16;color:#81ecff;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><p>オフラインです。ネットワーク接続を確認してください。</p></body></html>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        ))
      )
    )
    return
  }
})
