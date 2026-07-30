import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class AuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { auth, request, response } = ctx

    try {
      await auth.check()
      await next()
    } catch {
      if (request.url().startsWith('/api/')) {
        return response.status(401).json({ error: 'Please login to continue' })
      }

      return response.redirect().toPath(`/login?redirect=${encodeURIComponent(request.url())}`)
    }
  }
}
