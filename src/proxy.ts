import createIntlMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'
import { type NextRequest, NextResponse } from 'next/server'

const intlMiddleware = createIntlMiddleware(routing)

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // next-intl: admin 以外のルートを処理
  if (!pathname.startsWith('/admin')) {
    return intlMiddleware(request)
  }

  // DEMO モード: 認証不要ですべての admin ルートを通す
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|.*\\..*).*)',],
}
