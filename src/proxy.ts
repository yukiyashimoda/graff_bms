import createIntlMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const intlMiddleware = createIntlMiddleware(routing)

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // next-intl: admin 以外のルートを処理
  if (!pathname.startsWith('/admin')) {
    return intlMiddleware(request)
  }

  // admin/login はそのまま通す
  if (pathname.startsWith('/admin/login')) {
    return NextResponse.next()
  }

  // admin ルート: セッション確認
  const response = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|.*\\..*).*)',],
}
