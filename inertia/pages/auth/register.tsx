import { useState } from 'react'
import { Link, router } from '@inertiajs/react'
import AuthLayout, { AuthPassword } from '../components/AuthLayout'
import { ArrowUpRight } from 'lucide-react'

export default function Register() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirmation: '',
    agreeTerms: false,
  })
  const [errors, setErrors] = useState<{
    name?: string
    email?: string
    password?: string
    passwordConfirmation?: string
    agreeTerms?: string
    general?: string
  }>({})

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    if (!formData.email) {
      newErrors.email = 'Email address is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (!formData.passwordConfirmation) {
      newErrors.passwordConfirmation = 'Please confirm your password'
    } else if (formData.password !== formData.passwordConfirmation) {
      newErrors.passwordConfirmation = 'Passwords do not match'
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the Terms of Service'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      await router.post(
        '/register',
        {
          fullName: formData.name.trim(),
          email: formData.email.toLowerCase().trim(),
          password: formData.password,
          passwordConfirmation: formData.passwordConfirmation,
          terms: formData.agreeTerms,
          redirect: sessionStorage.getItem('redirectAfterLogin') || undefined,
        },
        {
          onError: (error) => {
            console.error('Registration error:', error)
            if (typeof error === 'object' && error !== null) {
              // Handle field-specific errors from backend
              if (error.email) {
                setErrors((prev) => ({ ...prev, email: error.email }))
              } else if (error.fullName) {
                setErrors((prev) => ({ ...prev, name: error.fullName }))
              } else if (error.password) {
                setErrors((prev) => ({ ...prev, password: error.password }))
              } else if (error.terms) {
                setErrors((prev) => ({ ...prev, agreeTerms: error.terms }))
              } else if (error.passwordConfirmation) {
                setErrors((prev) => ({ ...prev, passwordConfirmation: error.passwordConfirmation }))
              } else if (error.form) {
                setErrors((prev) => ({ ...prev, general: error.form }))
              } else if (error.message) {
                setErrors((prev) => ({ ...prev, general: error.message }))
              } else {
                setErrors((prev) => ({
                  ...prev,
                  general: 'Registration failed. Please try again.',
                }))
              }
            } else {
              setErrors((prev) => ({
                ...prev,
                general: 'An unexpected error occurred. Please try again.',
              }))
            }
          },
          onFinish: () => {
            setIsSubmitting(false)
          },
        }
      )
    } catch (error) {
      console.error('Registration submission error:', error)
      setErrors({ general: 'An unexpected error occurred. Please try again.' })
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout mode="register">
      {errors.general && (
        <p role="alert" className="auth-error auth-error-summary">
          {errors.general}
        </p>
      )}
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-field">
          <label htmlFor="register-name">Full name</label>
          <input
            id="register-name"
            name="fullName"
            type="text"
            autoComplete="name"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value })
              setErrors((prev) => ({ ...prev, name: undefined }))
            }}
            placeholder="Your full name"
            minLength={2}
            maxLength={120}
            required
            disabled={isSubmitting}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'register-name-error' : undefined}
          />
          {errors.name && (
            <p id="register-name-error" role="alert" className="auth-error">
              {errors.name}
            </p>
          )}
        </div>
        <div className="auth-field">
          <label htmlFor="register-email">Email address</label>
          <input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value })
              setErrors((prev) => ({ ...prev, email: undefined }))
            }}
            placeholder="name@example.com"
            maxLength={254}
            required
            disabled={isSubmitting}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'register-email-error' : undefined}
          />
          {errors.email && (
            <p id="register-email-error" role="alert" className="auth-error">
              {errors.email}
            </p>
          )}
        </div>
        <div className="auth-field">
          <label htmlFor="register-password">Password</label>
          <AuthPassword
            id="register-password"
            name="password"
            autoComplete="new-password"
            value={formData.password}
            onChange={(e) => {
              setFormData({ ...formData, password: e.target.value })
              setErrors((prev) => ({
                ...prev,
                password: undefined,
                passwordConfirmation: undefined,
              }))
            }}
            placeholder="At least 8 characters"
            minLength={8}
            maxLength={72}
            required
            disabled={isSubmitting}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'register-password-error' : undefined}
          />
          {errors.password && (
            <p id="register-password-error" role="alert" className="auth-error">
              {errors.password}
            </p>
          )}
        </div>
        <div className="auth-field">
          <label htmlFor="register-confirm">Confirm password</label>
          <AuthPassword
            id="register-confirm"
            name="passwordConfirmation"
            autoComplete="new-password"
            value={formData.passwordConfirmation}
            onChange={(e) => {
              setFormData({ ...formData, passwordConfirmation: e.target.value })
              setErrors((prev) => ({ ...prev, passwordConfirmation: undefined }))
            }}
            placeholder="Re-enter your password"
            maxLength={72}
            required
            disabled={isSubmitting}
            aria-invalid={!!errors.passwordConfirmation}
            aria-describedby={errors.passwordConfirmation ? 'register-confirm-error' : undefined}
          />
          {errors.passwordConfirmation && (
            <p id="register-confirm-error" role="alert" className="auth-error">
              {errors.passwordConfirmation}
            </p>
          )}
        </div>
        <label className="auth-check auth-terms">
          <input
            type="checkbox"
            checked={formData.agreeTerms}
            onChange={(e) => {
              setFormData({ ...formData, agreeTerms: e.target.checked })
              setErrors((prev) => ({ ...prev, agreeTerms: undefined }))
            }}
            required
            disabled={isSubmitting}
          />
          <span>
            I agree to the <Link href="/terms">Terms of Service</Link> and{' '}
            <Link href="/privacy">Privacy Policy</Link>.
          </span>
        </label>
        {errors.agreeTerms && (
          <p role="alert" className="auth-error">
            {errors.agreeTerms}
          </p>
        )}
        <button type="submit" className="auth-submit" disabled={isSubmitting}>
          <span>{isSubmitting ? 'Creating your account?' : 'Create account'}</span>
          <ArrowUpRight size={17} />
        </button>
      </form>
    </AuthLayout>
  )
}
