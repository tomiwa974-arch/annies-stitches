import type { ReactNode } from 'react'
import { Link, usePage } from '@inertiajs/react'
import ProfileMenu from './ProfileMenu'
import AtelierClock from './AtelierClock'

const destinations = [
  ['Home', '/'],
  ['Collection', '/collection'],
  ['Store', '/store'],
  ['Magazine', '/magazine'],
  ['Custom wear', '/custom'],
  ['About', '/about'],
]

export default function PublicNavigation({ children }: { children: ReactNode }) {
  const { url, props } = usePage()
  const path = url.split('?')[0].split('#')[0]
  const signedIn = Boolean((props.auth as { user?: unknown } | undefined)?.user)
  const home = path === '/'
  const authPage =
    path === '/login' ||
    path === '/register' ||
    path === '/logged-out' ||
    path === '/admin/login' ||
    path === '/admin/logged-out'
  const theme =
    path.startsWith('/store') ||
    path === '/products' ||
    path.startsWith('/about') ||
    path === '/login' ||
    path === '/register'
      ? 'sage'
      : path.startsWith('/collection') ||
          path.startsWith('/magazine') ||
          path === '/userdashboard' ||
          path.startsWith('/guests/')
        ? 'wine'
        : path.startsWith('/custom')
          ? 'clay'
          : 'bronze'

  return (
    <>
      <div className="public-navigation-position" data-navigation-theme={theme}>
        {!authPage && (
          <div className="public-navigation-row">
            {!home && (
              <nav className="public-navigation" aria-label="Main navigation">
                {destinations.map(([label, href]) => {
                  const active =
                    href === '/collection'
                      ? path === href || path === '/userdashboard' || path.startsWith('/guests/')
                      : href === '/store'
                        ? path === href || path === '/products'
                        : href === '/magazine'
                          ? path === href || path.startsWith('/magazine/')
                          : path === href
                  return (
                    <Link
                      key={href}
                      href={href}
                      className="public-navigation-pill"
                      aria-current={active ? 'page' : undefined}
                    >
                      {label}
                    </Link>
                  )
                })}
                {signedIn ? (
                  <Link href="/logout" method="post" as="button" className="public-navigation-pill">
                    Logout
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="public-navigation-pill"
                    aria-current={
                      path.startsWith('/login') || path.startsWith('/register') ? 'page' : undefined
                    }
                  >
                    Login / Signup
                  </Link>
                )}
              </nav>
            )}
            <ProfileMenu />
          </div>
        )}
        <AtelierClock />
      </div>
      <div className={`public-page-content${home ? ' is-home' : ''}`}>{children}</div>
    </>
  )
}
