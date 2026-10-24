import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class AdminMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { auth, response } = ctx

    if (!(await auth.check()) || !auth.user?.isActive || auth.user.role !== 'admin') {
      if (
        ctx.request.header('accept')?.includes('application/json') &&
        !ctx.request.header('x-inertia')
      )
        return response.forbidden({ error: 'This workspace is available to administrators only.' })
      return response.redirect().toPath('/admin/login')
    }
    response.header('Cache-Control', 'no-store, private')
    ctx.inertia.encryptHistory()
    return next()
  }
}
