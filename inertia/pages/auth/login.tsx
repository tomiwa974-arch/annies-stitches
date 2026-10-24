import { useState } from 'react'
import { Link, usePage, router } from '@inertiajs/react'
import AuthLayout, { AuthPassword } from '../components/AuthLayout'
import { ArrowUpRight } from 'lucide-react'

export default function Login() {
  const { errors, adminLogin = false } = usePage().props as any
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false,
  })
  const [serverError, setServerError] = useState<string | null>(null)

  // Get the redirect URL from sessionStorage or query params
  const getRedirectUrl = (): string | undefined => {
    if (adminLogin) return '/admin'
    // Check sessionStorage first (set by store.tsx)
    const storedRedirect = sessionStorage.getItem('redirectAfterLogin')
    if (storedRedirect) {
      return storedRedirect
    }

    // Check URL params as fallback
    const urlParams = new URLSearchParams(window.location.search)
    const redirectParam = urlParams.get('redirect')
    if (redirectParam) {
      return redirectParam
    }

    // Default redirect to store
    return undefined
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setServerError(null)

    try {
      const redirectUrl = getRedirectUrl()

      await router.post(
        adminLogin ? '/admin/login' : '/login',
        {
          email: formData.email,
          password: formData.password,
          remember: formData.remember,
          redirect: redirectUrl,
        },
        {
          onSuccess: () => {
            sessionStorage.removeItem('redirectAfterLogin')
          },
          onError: (error) => {
            console.error('Login error:', error)
            if (error.message) {
              setServerError(error.message)
            } else if (error.form) {
              setServerError(error.form)
            } else if (error.errors) {
              // Handle validation errors from backend
              const errorMessages = Object.values(error.errors).flat()
              setServerError(
                (errorMessages[0] as string) || 'Login failed. Please check your credentials.'
              )
            } else {
              setServerError('Invalid email or password. Please try again.')
            }
          },
          onFinish: () => {
            setIsSubmitting(false)
          },
        }
      )
    } catch (error) {
      console.error('Login submission error:', error)
      setServerError('An unexpected error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout mode="login" admin={adminLogin}>
      {(serverError || errors?.email || errors?.form) && (
        <p className="auth-error auth-error-summary" role="alert">
          {serverError || errors?.email || errors?.form}
        </p>
      )}
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-field">
          <label htmlFor="login-email">Email address</label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="name@example.com"
            required
            disabled={isSubmitting}
          />
        </div>
        <div className="auth-field">
          <label htmlFor="login-password">Password</label>
          <AuthPassword
            id="login-password"
            name="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Enter your password"
            required
            disabled={isSubmitting}
          />
        </div>
        <div className="auth-options">
          <label className="auth-check">
            <input
              type="checkbox"
              checked={formData.remember}
              onChange={(e) => setFormData({ ...formData, remember: e.target.checked })}
              disabled={isSubmitting}
            />
            Remember me
          </label>
          <Link href="/forgot-password">Forgot password?</Link>
        </div>
        <button type="submit" className="auth-submit" disabled={isSubmitting}>
          <span>{isSubmitting ? 'Signing in?' : 'Sign in'}</span>
          <ArrowUpRight size={17} />
        </button>
      </form>
    </AuthLayout>
  )
}
