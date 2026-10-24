import { Head, Link } from '@inertiajs/react'
import { ArrowUpRight, Check } from 'lucide-react'
import { TailoringBackground } from '../components/TailoringBackground'
import '../../css/auth-atelier.css'

export default function LoggedOut() {
  return (
    <div className="auth-atelier auth-signed-out">
      <Head title="Signed out | Annie's Stitches" />
      <div className="auth-floating">
        <TailoringBackground />
      </div>
      <div className="auth-wash" aria-hidden="true" />
      <main className="auth-card" aria-labelledby="signed-out-title">
        <Check size={28} aria-hidden="true" />
        <div className="auth-card-heading">
          <p className="auth-eyebrow">ANNIE'S / THE STUDIO</p>
          <h1 id="signed-out-title">You’re signed out.</h1>
          <p>
            Your admin session has ended. Sign in again when you’re ready to return to the studio.
          </p>
        </div>
        <Link href="/admin/login?redirect=/admin" className="auth-submit">
          Sign in again <ArrowUpRight size={17} />
        </Link>
      </main>
    </div>
  )
}
