import { isAdminRequest } from '#services/auth_scope'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import app from '@adonisjs/core/services/app'
import ShieldMiddleware from '@adonisjs/shield/shield_middleware'
import shieldConfig from '#config/shield'

let adminShield: Promise<ShieldMiddleware> | undefined
export default class ScopedShieldMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    if (!isAdminRequest(ctx))
      return (await ctx.containerResolver.make(ShieldMiddleware)).handle(ctx, next)
    adminShield ||= (async () =>
      new ShieldMiddleware(
        {
          ...shieldConfig,
          csrf: {
            ...shieldConfig.csrf,
            cookieOptions: { ...shieldConfig.csrf.cookieOptions, path: '/admin' },
          },
        },
        await app.container.make('encryption'),
        app.usingEdgeJS ? (await import('edge.js')).default : undefined
      ))()
    return (await adminShield).handle(ctx, next)
  }
}
