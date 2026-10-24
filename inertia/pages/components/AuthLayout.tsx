import { useState, type ReactNode, type InputHTMLAttributes } from 'react'
import { Head, Link } from '@inertiajs/react'
import { ArrowLeft, ArrowUpRight, Eye, EyeOff } from 'lucide-react'
import { TailoringBackground } from './TailoringBackground'
import '../../css/auth-atelier.css'

export default function AuthLayout({
  mode,
  children,
  admin = false,
}: {
  mode: 'login' | 'register'
  children: ReactNode
  admin?: boolean
}) {
  const register = mode === 'register'
  return (
    <div className={`auth-atelier auth-${mode}`}>
      <Head title={`${register ? 'Create Account' : 'Sign In'} | Annie's Stitches`} />
      <div className="auth-floating">
        <TailoringBackground />
      </div>
      <div className="auth-wash" aria-hidden="true" />
      <header className="auth-masthead">
        <Link href="/" className="auth-brand" aria-label="Annie's Stitches home">
          annie's<span>FASHION HOUSE</span>
        </Link>
        <Link href="/" className="auth-back">
          <ArrowLeft size={15} /> Back to the house
        </Link>
      </header>
      <main className="auth-composition">
        <section className="auth-story" aria-labelledby="auth-story-title">
          <p className="auth-eyebrow">
            {admin ? 'THE ATELIER / ADMIN SIGN IN' : 'THE ATELIER / YOUR ACCOUNT'}
          </p>
          <h1 id="auth-story-title">
            A little more
            <br />
            {register ? 'you.' : 'familiar.'}
            <br />
            <em>{register ? 'A little more us.' : 'Always personal.'}</em>
          </h1>
          <p className="auth-story-description">
            {register
              ? 'A place for the pieces you love, the details that matter, and whatever comes next.'
              : 'Your favourite pieces. Your next occasion. Your own corner of the house.'}
          </p>
          <div className="auth-story-note">
            <span>THOUGHTFULLY MADE</span>
            <p>Personal style, down to the last stitch.</p>
          </div>
        </section>
        <section className="auth-card" aria-labelledby="auth-form-title">
          {!admin && (
            <nav className="auth-tabs" aria-label="Account access">
              <Link href="/login" aria-current={!register ? 'page' : undefined}>
                Sign in
              </Link>
              <Link href="/register" aria-current={register ? 'page' : undefined}>
                Create account
              </Link>
            </nav>
          )}
          <div className="auth-card-heading">
            <p className="auth-eyebrow">
              {register ? 'MAKE YOURSELF AT HOME' : 'GOOD TO HAVE YOU BACK'}
            </p>
            <h2 id="auth-form-title">
              {admin
                ? 'Welcome to the studio.'
                : register
                  ? 'Your story starts here.'
                  : 'Welcome back.'}
            </h2>
            <p>
              {register
                ? 'A few details, and you’re part of the house.'
                : 'Sign in to pick up where you left off.'}
            </p>
          </div>
          {children}
          {!admin && (
            <p className="auth-switch">
              {register ? 'Already part of the house?' : 'New around here?'}{' '}
              <Link href={register ? '/login' : '/register'}>
                {register ? 'Sign in' : 'Create an account'} <ArrowUpRight size={14} />
              </Link>
            </p>
          )}
        </section>
      </main>
      <footer className="auth-footer">
        <span>© {new Date().getFullYear()} ANNIE'S STITCHES</span>
        <span>INDIVIDUAL BY DESIGN.</span>
      </footer>
    </div>
  )
}

export function AuthPassword(props: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="auth-password">
      <input {...props} type={visible ? 'text' : 'password'} />
      <button
        type="button"
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        disabled={props.disabled}
        onClick={() => setVisible(!visible)}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  )
}
