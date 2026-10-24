import type { HttpContext } from '@adonisjs/core/http'
import { User } from '#models/index'
import hash from '@adonisjs/core/services/hash'
import { v4 as uuidv4 } from 'uuid'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import vine from '@vinejs/vine'

export default class AuthsController {
  // Get user data for API - PROTECTED
  async getUserData({ auth, response }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user as User
      return response.json({
        id: user?.id,
        fullName: user?.fullName,
        email: user?.email,
        role: user?.role,
        isActive: user?.isActive,
      })
    } catch (error) {
      return response.status(401).json({ error: 'Not authenticated' })
    }
  }

  // User dashboard - public page with optional user data
  async userdashboard({ inertia, auth }: HttpContext) {
    let user: User | null = null

    try {
      await auth.check()
      user = auth.user as User
    } catch {
      user = null
    }

    return inertia.render('dashboard/user/userdashboard', {
      user: user
        ? {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
          }
        : null,
    })
  }

  // Render login page
  async showLogin({ inertia, auth, response, request }: HttpContext) {
    const adminLogin = request.url().startsWith('/admin')
    if ((await auth.check()) && auth.user?.isActive && (!adminLogin || auth.user.role === 'admin'))
      return response.redirect().toPath(adminLogin ? '/admin' : '/store')
    return inertia.render('auth/login', { adminLogin })
  }

  // Handle login form submission
  async login({ request, response, session, auth }: HttpContext) {
    try {
      const { email, password, remember, redirect } = request.only([
        'email',
        'password',
        'remember',
        'redirect',
      ])

      const user = await User.findBy('email', email)

      if (!user) {
        session.flash('errors', {
          form: 'Invalid email or password',
        })
        return response.redirect().back()
      }

      const isValidPassword = await hash.verify(user.password, password)

      if (!isValidPassword) {
        session.flash('errors', {
          form: 'Invalid email or password',
        })
        return response.redirect().back()
      }

      // Check if user is active
      if (!user.isActive) {
        session.flash('errors', {
          form: 'Your account has been deactivated',
        })
        return response.redirect().back()
      }

      if (request.url().startsWith('/admin') && user.role !== 'admin') {
        session.flashErrors({
          form: 'This account does not have admin access. Please use an administrator account.',
        })
        return response.redirect().toPath('/admin/login')
      }
      await auth.use().logout()
      await auth.use().login(user, !!remember)
      user.lastSeenAt = DateTime.now()
      user.presenceOnline = true
      await user.save()

      if (
        typeof redirect === 'string' &&
        redirect.startsWith('/') &&
        !redirect.startsWith('//') &&
        !redirect.includes('\\')
      ) {
        return response.redirect().toPath(redirect)
      }
      // Redirect based on role
      if (request.url().startsWith('/admin')) return response.redirect().toPath('/admin')

      return response.redirect().toRoute('user.dashboard')
    } catch (error) {
      console.error('Login error:', error)
      session.flash('errors', {
        form: 'Invalid email or password',
      })
      return response.redirect().back()
    }
  }

  // Render register page
  async showRegister({ inertia, auth, response }: HttpContext) {
    if ((await auth.check()) && auth.user?.isActive) return response.redirect().toPath('/store')

    return inertia.render('auth/register')
  }

  // Handle register form submission
  async register({ request, response, session, auth }: HttpContext) {
    try {
      const { fullName, email, password, passwordConfirmation, terms } =
        await request.validateUsing(
          vine.compile(
            vine.object({
              fullName: vine.string().trim().minLength(2).maxLength(120),
              email: vine
                .string()
                .trim()
                .email()
                .maxLength(254)
                .transform((value) => value.toLowerCase()),
              password: vine.string().minLength(8).maxLength(72),
              passwordConfirmation: vine.string(),
              terms: vine.literal(true),
            })
          )
        )

      if (password !== passwordConfirmation) {
        session.flash('errors', {
          passwordConfirmation: 'Passwords do not match',
        })
        return response.redirect().back()
      }

      if (!terms) {
        session.flash('errors', {
          terms: 'You must accept the terms and conditions',
        })
        return response.redirect().back()
      }

      const existingUser = await User.findBy('email', email)
      if (existingUser) {
        session.flash('errors', {
          email: 'Email already registered',
        })
        return response.redirect().back()
      }

      const hashedPassword = await hash.make(password)

      const user = await db.transaction(async (trx) => {
        const setup = await trx.from('admin_setup').where('id', 1).forUpdate().firstOrFail()
        const firstAdmin =
          !setup.claimed_at &&
          setup.reserved_email === email &&
          !(await User.query({ client: trx }).where('role', 'admin').first())
        const account = await User.create(
          {
            email: email,
            password: hashedPassword,
            fullName: fullName,
            role: firstAdmin ? 'admin' : 'user',
            isActive: true,
            lastSeenAt: DateTime.now(),
            presenceOnline: true,
          },
          { client: trx }
        )
        if (firstAdmin)
          await trx.from('admin_setup').where('id', 1).update({ claimed_at: new Date() })
        return account
      })

      await auth.use().login(user)

      const destination = request.input('redirect')
      if (
        typeof destination === 'string' &&
        destination.startsWith('/') &&
        !destination.startsWith('//') &&
        !destination.includes('\\')
      )
        return response.redirect().toPath(destination)
      return response.redirect().toPath(user.role === 'admin' ? '/admin/login' : '/store')
    } catch (error) {
      if (error.code === 'E_VALIDATION_ERROR') throw error
      console.error('Registration error:', error)
      session.flash('errors', {
        form: 'An error occurred during registration',
      })
      return response.redirect().back()
    }
  }

  // Handle logout
  async logout({ auth, response, session }: HttpContext) {
    try {
      const admin = auth.defaultGuard === 'admin'
      await auth.check()
      if (auth.user) await User.query().where('id', auth.user!.id).update({ presenceOnline: false })
      await auth.use().logout()
      session.clear()
      session.regenerate()
      return response.redirect().toPath(admin ? '/admin/logged-out' : '/userdashboard')
    } catch (error) {
      console.error('Logout error:', error)
      return response.redirect().back()
    }
  }

  async signedOut({ inertia, response, auth }: HttpContext) {
    if ((await auth.check()) && auth.user?.isActive)
      return response.redirect().toPath(auth.defaultGuard === 'admin' ? '/admin' : '/store')
    response.header('Cache-Control', 'no-store, private')
    inertia.clearHistory()
    return inertia.render('auth/logged-out')
  }

  // Forgot password page
  async showForgotPassword({ inertia }: HttpContext) {
    return inertia.render('auth/forgot-password')
  }

  // Handle forgot password request
  async forgotPassword({ request, response, session }: HttpContext) {
    try {
      const { email } = request.only(['email'])

      const user = (await User.findBy('email', email)) as User

      if (user) {
        const resetToken = uuidv4()
        user.resetToken = resetToken
        user.resetTokenExpiry = DateTime.now().plus({ hours: 1 })
        await user.save()

        console.log(`Password reset link: /reset-password/${resetToken}`)
      }

      session.flash(
        'success',
        'If your email is registered, you will receive a password reset link'
      )
      return response.redirect().back()
    } catch (error) {
      console.error('Forgot password error:', error)
      session.flash('errors', {
        form: 'An error occurred',
      })
      return response.redirect().back()
    }
  }

  // Reset password page
  async showResetPassword({ params, inertia, response }: HttpContext) {
    try {
      const { token } = params

      const user = (await User.query()
        .where('resetToken', token)
        .where('resetTokenExpiry', '>', DateTime.now().toSQL())
        .first()) as User

      if (!user) {
        return response.redirect().toRoute('auth.forgot-password')
      }

      return inertia.render('auth/reset-password', {
        token,
      })
    } catch (error) {
      console.error('Reset password error:', error)
      return response.redirect().toRoute('auth.forgot-password')
    }
  }

  // Handle reset password submission
  async resetPassword({ request, response, session }: HttpContext) {
    try {
      const { token, password, passwordConfirmation } = request.only([
        'token',
        'password',
        'passwordConfirmation',
      ])

      if (password !== passwordConfirmation) {
        session.flash('errors', {
          passwordConfirmation: 'Passwords do not match',
        })
        return response.redirect().back()
      }

      const user = (await User.query()
        .where('resetToken', token)
        .where('resetTokenExpiry', '>', DateTime.now().toSQL())
        .first()) as User

      if (!user) {
        session.flash('errors', {
          form: 'Invalid or expired reset token',
        })
        return response.redirect().toRoute('auth.forgot-password')
      }

      const hashedPassword = await hash.make(password)
      user.password = hashedPassword
      user.resetToken = null
      user.resetTokenExpiry = null
      await user.save()

      session.flash('success', 'Password reset successfully. Please login with your new password.')
      return response.redirect().toRoute('auth.login')
    } catch (error) {
      console.error('Reset password error:', error)
      session.flash('errors', {
        form: 'An error occurred',
      })
      return response.redirect().back()
    }
  }
}
