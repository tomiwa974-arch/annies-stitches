import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class AuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { auth, request, response } = ctx

    try {
      if (!(await auth.check()) || !auth.user?.isActive) throw new Error('Unauthenticated')
    } catch {
      if (request.url().startsWith('/api/') || request.url().startsWith('/admin/account')) {
        return response.status(401).json({ error: 'Please login to continue' })
      }

      return response
        .redirect()
        .toPath(
          `${request.url().startsWith('/admin') ? '/admin/login' : '/login'}?redirect=${encodeURIComponent(request.url())}`
        )
    }
    return next()
  }
}
