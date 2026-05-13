import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { User } from '#models/index'

export default class AdminMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { auth, response } = ctx
    
    try {
      // Check if user is logged in
      await auth.check()
      const user = auth.user as User
      
      // Check if user has admin role
      if (!user || user.role !== 'admin') {
        return response.redirect().toRoute('auth.login')
      }
      
      // User is admin, proceed to the next middleware/controller
      await next()
    } catch (error) {
      // User is not logged in, redirect to login
      return response.redirect().toRoute('auth.login')
    }
  }
}