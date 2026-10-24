import type { HttpContext } from '@adonisjs/core/http'

export function isAdminRequest(ctx: HttpContext) {
  const path = ctx.route?.pattern || ctx.request.url()
  return path === '/admin' || path.startsWith('/admin/')
}
