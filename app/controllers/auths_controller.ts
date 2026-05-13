import type { HttpContext } from '@adonisjs/core/http'
import { User } from '#models/index'
import hash from '@adonisjs/core/services/hash'
import { v4 as uuidv4 } from 'uuid'
import { DateTime } from 'luxon'

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
        isActive: user?.isActive
      })
    } catch (error) {
      return response.status(401).json({ error: 'Not authenticated' })
    }
  }

  // User dashboard - protected route
  async userdashboard({ inertia, auth, response }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user as User
      return inertia.render('dashboard/user/userdashboard', {
        user: user ? {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          isActive: user.isActive
        } : null
      })
    } catch (error) {
      console.error('User dashboard error:', error)
      return response.redirect().toRoute('auth.login')
    }
  }

  // Render login page - redirects to dashboard if already logged in
  async showLogin({ inertia, auth, response }: HttpContext) {
    try {
      await auth.check()
      return response.redirect().toRoute('user.dashboard')
    } catch {
      return inertia.render('auth/login')
    }
  }

  // Handle login form submission
  async login({ request, response, session, auth }: HttpContext) {
    try {
      const { email, password, remember } = request.only(['email', 'password', 'remember'])
      
      const user = await User.findBy('email', email)
      
      if (!user) {
        session.flash('errors', {
          form: 'Invalid email or password'
        })
        return response.redirect().back()
      }
      
      const isValidPassword = await hash.verify(user.password, password)
      
      if (!isValidPassword) {
        session.flash('errors', {
          form: 'Invalid email or password'
        })
        return response.redirect().back()
      }
      
      // Check if user is active
      if (!user.isActive) {
        session.flash('errors', {
          form: 'Your account has been deactivated'
        })
        return response.redirect().back()
      }
      
      await auth.use('web').login(user, !!remember)
      
      // Redirect based on role
      if (user.role === 'admin') {
        return response.redirect().toPath('/admin')
      }
      
      return response.redirect().toRoute('user.dashboard')
      
    } catch (error) {
      console.error('Login error:', error)
      session.flash('errors', {
        form: 'Invalid email or password'
      })
      return response.redirect().back()
    }
  }

  // Render register page
  async showRegister({ inertia, auth, response }: HttpContext) {
    try {
      await auth.check()
      return response.redirect().toRoute('user.dashboard')
    } catch {
      return inertia.render('auth/register')
    }
  }

  // Handle register form submission
  async register({ request, response, session, auth }: HttpContext) {
    try {
      const { fullName, email, password, passwordConfirmation, terms } = request.only([
        'fullName', 
        'email', 
        'password', 
        'passwordConfirmation',
        'terms'
      ])
      
      if (password !== passwordConfirmation) {
        session.flash('errors', {
          passwordConfirmation: 'Passwords do not match'
        })
        return response.redirect().back()
      }
      
      if (!terms) {
        session.flash('errors', {
          terms: 'You must accept the terms and conditions'
        })
        return response.redirect().back()
      }
      
      const existingUser = await User.findBy('email', email)
      if (existingUser) {
        session.flash('errors', {
          email: 'Email already registered'
        })
        return response.redirect().back()
      }
      
      const hashedPassword = await hash.make(password)
      
      const user = await User.create({
        email: email,
        password: hashedPassword,
        fullName: fullName,
        role: 'user',
        isActive: true
      })
      
      await auth.use('web').login(user)
      
      return response.redirect().toRoute('user.dashboard')
      
    } catch (error) {
      console.error('Registration error:', error)
      session.flash('errors', {
        form: 'An error occurred during registration'
      })
      return response.redirect().back()
    }
  }

  // Handle logout
  async logout({ auth, response }: HttpContext) {
    try {
      await auth.use('web').logout()
      return response.redirect().toRoute('auth.login')
    } catch (error) {
      console.error('Logout error:', error)
      return response.redirect().back()
    }
  }

  // Forgot password page
  async showForgotPassword({ inertia }: HttpContext) {
    return inertia.render('auth/forgot-password')
  }

  // Handle forgot password request
  async forgotPassword({ request, response, session }: HttpContext) {
    try {
      const { email } = request.only(['email'])
      
      const user = await User.findBy('email', email) as User
      
      if (user) {
        const resetToken = uuidv4()
        user.resetToken = resetToken
        user.resetTokenExpiry = DateTime.now().plus({ hours: 1 })
        await user.save()
        
        console.log(`Password reset link: /reset-password/${resetToken}`)
      }
      
      session.flash('success', 'If your email is registered, you will receive a password reset link')
      return response.redirect().back()
      
    } catch (error) {
      console.error('Forgot password error:', error)
      session.flash('errors', {
        form: 'An error occurred'
      })
      return response.redirect().back()
    }
  }

  // Reset password page
  async showResetPassword({ params, inertia, response }: HttpContext) {
    try {
      const { token } = params
      
      const user = await User.query()
        .where('resetToken', token)
        .where('resetTokenExpiry', '>', DateTime.now().toSQL())
        .first() as User
      
      if (!user) {
        return response.redirect().toRoute('auth.forgot-password')
      }
      
      return inertia.render('auth/reset-password', {
        token
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
        'passwordConfirmation'
      ])
      
      if (password !== passwordConfirmation) {
        session.flash('errors', {
          passwordConfirmation: 'Passwords do not match'
        })
        return response.redirect().back()
      }
      
      const user = await User.query()
        .where('resetToken', token)
        .where('resetTokenExpiry', '>', DateTime.now().toSQL())
        .first() as User
      
      if (!user) {
        session.flash('errors', {
          form: 'Invalid or expired reset token'
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
        form: 'An error occurred'
      })
      return response.redirect().back()
    }
  }
}