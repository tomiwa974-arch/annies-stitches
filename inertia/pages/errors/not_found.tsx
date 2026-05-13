
import { Head, Link } from '@inertiajs/react'
import { TailoringBackground } from '../components/TailoringBackground'

export default function NotFound() {
  return (
    <>
      <Head title="Page Not Found | Annie's Stitches" />

      <div className="min-h-screen bg-black text-white font-sans flex relative overflow-hidden">
        
        {/* Tailoring Background */}
        <TailoringBackground />
        
        {/* Dark overlay for better contrast */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-[1]" />

        {/* Content */}
        <div className="relative z-10 w-full flex items-center justify-center p-8">
          <div className="max-w-md text-center space-y-8">
            
            {/* Decorative element */}
            <div className="relative">
              <div className="text-9xl font-light text-stone-700">404</div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-px bg-stone-600"></div>
              </div>
            </div>
            
            <h1 className="text-3xl font-light">Page Not Found</h1>
            
            <p className="text-stone-400">
              The page you're looking for doesn't exist or has been moved.
            </p>
            
            <div className="pt-4">
              <Link 
                href="/" 
                className="inline-flex items-center gap-2 px-6 py-3 border border-stone-700 rounded-full hover:border-white transition-colors duration-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Back to Home</span>
              </Link>
            </div>

            <div className="pt-8 text-xs text-stone-600">
              <Link href="/store" className="hover:text-white transition-colors">Store</Link>
              <span className="mx-2">·</span>
              <Link href="/login" className="hover:text-white transition-colors">Login</Link>
              <span className="mx-2">·</span>
              <Link href="/register" className="hover:text-white transition-colors">Register</Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 left-0 right-0 text-center text-xs text-stone-600 z-10">
          © 2026 ANNIE'S STITCHES
        </div>
      </div>
    </>
  )
}