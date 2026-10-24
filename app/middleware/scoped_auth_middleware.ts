import { isAdminRequest } from '#services/auth_scope'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { Authenticator } from '@adonisjs/auth'
import type {} from '@adonisjs/auth/initialize_auth_middleware'

export default class ScopedAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const manager = await ctx.containerResolver.make('auth.manager')
    ctx.auth = new Authenticator(ctx, {
      ...manager.config,
      default: isAdminRequest(ctx) ? 'admin' : 'web',
    })
    if ('view' in ctx) ctx.view.share({ auth: ctx.auth })
    return next()
  }
}
