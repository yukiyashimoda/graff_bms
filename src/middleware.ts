import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'

export default createMiddleware(routing)

export const config = {
  // admin・API・静的ファイルは除外
  matcher: [
    '/((?!admin|api|_next/static|_next/image|favicon\\.ico|icons|fonts|sw\\.js|manifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
