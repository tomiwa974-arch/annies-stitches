import type { ReactNode } from 'react'
import { Head, Link } from '@inertiajs/react'

const links = [
  ['Collection', '/collection'],
  ['Store', '/store'],
  ['Magazine', '/magazine'],
  ['Custom wear', '/custom'],
  ['About Annabel', '/about'],
]

export default function EditorialLayout({
  title,
  children,
  variant,
}: {
  title: string
  children: ReactNode
  variant?: 'magazine' | 'custom' | 'about' | 'home'
}) {
  return (
    <div className={`atelier-site${variant ? ` atelier-${variant}` : ''}`}>
      <Head title={`${title} | Annie's Fashion House`} />
      <main>{children}</main>
      <footer className="atelier-footer">
        <div>
          <Link href="/" className="atelier-logo">
            annie's<span>MADE WITH INTENTION.</span>
          </Link>
          <p>A little imagination. A considered cut. Something entirely you.</p>
        </div>
        <nav aria-label="Footer navigation">
          {links.map(([label, href]) => (
            <Link key={href} href={href}>
              {label} ↗
            </Link>
          ))}
        </nav>
        <span>© {new Date().getFullYear()} Annie's Fashion House</span>
      </footer>
    </div>
  )
}
