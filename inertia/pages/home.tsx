import { useEffect, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { TailoringBackground } from './components/TailoringBackground'; // Import the background component

export default function Welcome() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <>
      <Head title="Welcome to Annie's Fashion House" />

      <div className="min-h-screen bg-black text-white font-sans overflow-hidden relative">
        
        {/* Tailoring Background - Now added! */}
        <TailoringBackground />
        
        {/* Animated gradient overlay for depth */}
        <div className="fixed inset-0 bg-gradient-to-br from-black/80 via-transparent to-black/80 pointer-events-none z-[1]" />
        
        {/* Subtle pattern overlay */}
        <div className="fixed inset-0 opacity-10 pointer-events-none z-[1]" 
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />

        {/* Content */}
        <div className="relative z-10 min-h-screen flex flex-col">
          
          {/* Top bar with elegant logo */}
          <div className="w-full px-6 md:px-12 pt-12">
            <div className="max-w-7xl mx-auto">
              <Link 
                href="/" 
                className="text-xs tracking-[0.3em] text-stone-400 hover:text-white transition duration-700"
              >
                ANNIE'S STITCHES
              </Link>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-grow flex items-center justify-center px-6">
            <div className="max-w-5xl mx-auto text-center">
              
              {/* Elegant entrance animation */}
              <div className={`space-y-8 transition-all duration-1000 transform ${
                isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}>
                
                {/* Decorative line */}
                <div className="flex justify-center">
                  <div className="w-16 h-px bg-stone-600" />
                </div>
                
                {/* Main heading with premium typography */}
                <h1 className="text-6xl md:text-8xl lg:text-9xl font-light tracking-[-0.02em] text-white drop-shadow-2xl">
                  welcome to
                </h1>
                
                <div className="space-y-4">
                  <h2 className="text-7xl md:text-9xl lg:text-[10rem] font-bold tracking-[-0.03em] text-white leading-none drop-shadow-2xl">
                    ANNIE'S
                  </h2>
                  
                  <h3 className="text-5xl md:text-7xl lg:text-8xl font-light tracking-wide text-stone-300">
                    fashion house
                  </h3>
                </div>
                
                {/* Elegant divider */}
                <div className="flex justify-center gap-3 py-8">
                  <div className="w-2 h-2 rounded-full bg-stone-600" />
                  <div className="w-2 h-2 rounded-full bg-stone-600" />
                  <div className="w-2 h-2 rounded-full bg-stone-600" />
                </div>
                
                {/* Tagline */}
                <p className="text-base md:text-lg text-stone-400 max-w-2xl mx-auto leading-relaxed tracking-wide drop-shadow-lg">
                  Where elegance meets individuality — thoughtfully crafted pieces designed to reflect your unique style and confidence.
                </p>
                
                {/* Premium buttons */}
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
                  <Link
                    href="/userdashboard"
                    className="group relative overflow-hidden px-10 py-4 bg-white text-black rounded-full transition-all duration-500 hover:shadow-[0_0_40px_rgba(255,255,255,0.5)]"
                  >
                    <span className="relative z-10 text-sm font-medium tracking-wider">EXPLORE COLLECTION</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-stone-200 to-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                  </Link>
                  
                  <Link
                    href="/login"
                    className="group relative overflow-hidden px-10 py-4 border border-stone-600 text-white rounded-full transition-all duration-500 hover:border-white hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] backdrop-blur-sm"
                  >
                    <span className="relative z-10 text-sm font-medium tracking-wider">SIGN IN</span>
                    <div className="absolute inset-0 bg-white/10 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                  </Link>
                </div>
                
                {/* Decorative elements */}
                <p className="text-xs text-stone-600 mt-16 tracking-[0.3em]">
                  CUSTOM DESIGNS • READY-TO-WEAR • BRIDAL
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="w-full px-6 md:px-12 pb-8">
            <div className="max-w-7xl mx-auto text-center">
              <p className="text-xs text-stone-700 tracking-wider">
                © 2026 ANNIE'S FASHION HOUSE — ALL RIGHTS RESERVED
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes gradient {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        .animate-gradient {
          animation: gradient 8s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}