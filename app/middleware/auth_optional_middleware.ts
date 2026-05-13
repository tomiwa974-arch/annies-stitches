import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class AuthOptionalMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { auth } = ctx
    
    try {
      // Try to authenticate the user, but don't fail if not authenticated
      await auth.check()
    } catch (error) {
      // User is not logged in, that's fine - we just proceed without user data
    }
    
    // Always proceed to the next middleware/controller
    await next()
  }
}