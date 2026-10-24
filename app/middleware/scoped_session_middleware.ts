import { isAdminRequest } from '#services/auth_scope'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { configProvider } from '@adonisjs/core'
import app from '@adonisjs/core/services/app'
import SessionMiddleware from '@adonisjs/session/session_middleware'
import type { ResolvedSessionConfig } from '@adonisjs/session/types'

let adminSession: Promise<SessionMiddleware<ResolvedSessionConfig['stores']>> | undefined
export default class ScopedSessionMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    if (!isAdminRequest(ctx))
      return (await ctx.containerResolver.make(SessionMiddleware)).handle(ctx, next)
    adminSession ||= (async () => {
      const config = (await configProvider.resolve(
        app,
        app.config.get('session')
      )) as ResolvedSessionConfig
      return new SessionMiddleware(
        {
          ...config,
          cookieName: 'annies-admin-session',
          cookie: { ...config.cookie, path: '/admin' },
        },
        await app.container.make('emitter')
      )
    })()
    return (await adminSession).handle(ctx, next)
  }
}
