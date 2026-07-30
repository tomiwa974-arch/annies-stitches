import { useEffect, useState } from "react";
import { Head, Link } from "@inertiajs/react";

export default function Welcome() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [typedText, setTypedText] = useState("");
  const [typingComplete, setTypingComplete] = useState(false);
  
  const fullText = "ANNIE'S";

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Typing animation effect
  useEffect(() => {
    if (!isLoaded) return;
    
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < fullText.length) {
        setTypedText(fullText.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typingInterval);
        setTypingComplete(true);
      }
    }, 120);
    
    return () => clearInterval(typingInterval);
  }, [isLoaded]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Calculate parallax offset
  const parallaxX = (mousePosition.x / window.innerWidth - 0.5) * 20;
  const parallaxY = (mousePosition.y / window.innerHeight - 0.5) * 20;

  return (
    <>
      <Head title="Welcome to Annie's Fashion House" />

      <div className="min-h-screen text-white font-sans overflow-hidden relative">
        
        {/* Custom Font */}
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=Montserrat:wght@100;200;300;400;500;600&display=swap');
            
            .font-serif-premium {
              font-family: 'Cormorant Garamond', serif;
            }
            
            .font-sans-premium {
              font-family: 'Montserrat', sans-serif;
            }
            
            /* Cursor blink animation for typing */
            @keyframes blink {
              0%, 50% { opacity: 1; }
              51%, 100% { opacity: 0; }
            }
            
            .blinking-cursor {
              animation: blink 0.8s infinite;
            }
            
            /* Letter reveal animation */
            @keyframes letterReveal {
              0% {
                opacity: 0;
                transform: translateY(30px) rotateX(-90deg);
              }
              100% {
                opacity: 1;
                transform: translateY(0) rotateX(0);
              }
            }
            
            /* Writing animation for individual letters */
            .letter-visible {
              animation: letterReveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            
            /* Gradient text effect */
            .text-gradient {
              background: linear-gradient(135deg, #FFFFFF 0%, #E8DCC4 50%, #C4A574 100%);
              -webkit-background-clip: text;
              background-clip: text;
              color: transparent;
            }
          `}
        </style>
        
        {/* Custom Background Image */}
        <div 
          className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0 transition-transform duration-300 ease-out"
          style={{
            backgroundImage: `url('/images/annies studio.png')`,
            backgroundAttachment: 'fixed',
            transform: `translate(${parallaxX * 0.5}px, ${parallaxY * 0.5}px) scale(1.05)`,
          }}
        />
        
        {/* Dark overlay */}
        <div className="fixed inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30 z-[1]" />
        
        {/* Premium radial glow effect */}
        <div 
          className="fixed inset-0 pointer-events-none z-[1] opacity-30"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(196,165,116,0.15) 0%, transparent 60%)`,
          }}
        />

        {/* Film grain texture */}
        <div
          className="fixed inset-0 pointer-events-none z-[2] opacity-[0.03] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Content - SIDEBAR LAYOUT */}
        <div className="relative z-10 min-h-screen flex flex-col">
          
          {/* Top bar */}
          <div className="w-full px-6 md:px-12 pt-12">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <Link 
                href="/" 
                className="font-sans-premium text-[10px] tracking-[0.4em] text-stone-300 hover:text-white transition-all duration-700 group"
              >
                <span className="relative">
                  ANNIE'S
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-gradient-to-r from-white/60 to-transparent group-hover:w-full transition-all duration-700" />
                </span>
              </Link>
              
              <div className="hidden md:flex gap-8">
                <Link href="/store" className="font-sans-premium text-[9px] tracking-[0.3em] text-stone-400 hover:text-white transition-colors">COLLECTION</Link>
                <Link href="/login" className="font-sans-premium text-[9px] tracking-[0.3em] text-stone-400 hover:text-white transition-colors">STUDIO</Link>
                <Link href="/userdashboard" className="font-sans-premium text-[9px] tracking-[0.3em] text-stone-400 hover:text-white transition-colors">EDITORIAL</Link>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-grow flex items-center px-6 md:px-12">
            <div className="max-w-7xl mx-auto w-full">
              
              {/* Content Container */}
              <div className="max-w-2xl lg:max-w-xl xl:max-w-2xl">
                
                {/* Elegant entrance animation */}
                <div className={`space-y-6 transition-all duration-1000 transform ${
                  isLoaded ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'
                }`}>
                  
                  {/* Decorative line */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-px bg-gradient-to-r from-white/60 to-transparent" />
                    <span className="font-sans-premium text-[10px] tracking-[0.4em] text-stone-300 uppercase">Since 2026</span>
                  </div>
                  
                  {/* Main heading with writing animation */}
                  <div className="space-y-3">
                    <div className="overflow-hidden">
                      <h1 className="font-sans-premium text-4xl md:text-5xl lg:text-6xl font-light tracking-[-0.02em] text-white">
                        welcome to
                      </h1>
                    </div>
                    
                    {/* Writing Animation for ANNIE'S */}
                    <div className="overflow-visible">
                      <h2 className="font-serif-premium text-7xl md:text-8xl lg:text-9xl xl:text-[9rem] font-bold tracking-[-0.03em] leading-[1.1]">
                        {typedText.split('').map((char, index) => (
                          <span
                            key={index}
                            className={`inline-block ${typingComplete ? 'letter-visible' : ''}`}
                            style={{
                              animationDelay: `${index * 0.05}s`,
                              background: 'linear-gradient(135deg, #FFFFFF 0%, #E8DCC4 50%, #C4A574 100%)',
                              WebkitBackgroundClip: 'text',
                              backgroundClip: 'text',
                              color: 'transparent',
                            }}
                          >
                            {char}
                          </span>
                        ))}
                        {!typingComplete && (
                          <span className="inline-block w-[2px] h-[0.8em] bg-white/80 ml-1 animate-pulse" />
                        )}
                      </h2>
                    </div>
                  </div>
                  
                  {/* Elegant divider */}
                  <div className="flex items-center gap-3 py-2">
                    <div className="w-1 h-1 rounded-full bg-stone-400" />
                    <div className="w-8 h-px bg-stone-500" />
                    <div className="w-1 h-1 rounded-full bg-stone-400" />
                  </div>
                  
                  {/* Subtitle */}
                  <div className="overflow-hidden">
                    <h3 className="font-serif-premium text-2xl md:text-3xl lg:text-4xl font-light tracking-wide text-stone-200 italic">
                      fashion house
                    </h3>
                  </div>
                  
                  {/* Tagline */}
                  <p className="font-sans-premium text-sm md:text-base text-stone-300 max-w-lg leading-relaxed tracking-wide font-light">
                    Where elegance meets individuality — thoughtfully crafted 
                    pieces designed to reflect your unique style and confidence.
                  </p>
                  
                  {/* Premium buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <Link
                      href="/userdashboard"
                      className="group relative overflow-hidden px-8 py-3.5 bg-white text-black rounded-full transition-all duration-500 hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] hover:scale-105 w-fit font-sans-premium text-xs font-medium tracking-wider uppercase"
                    >
                      <span className="relative z-10">Explore Collection</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-stone-200 to-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                    </Link>
                    
                    <Link
                      href="/login"
                      className="group relative overflow-hidden px-8 py-3.5 border border-white/30 text-white rounded-full transition-all duration-500 hover:border-white hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] backdrop-blur-sm hover:scale-105 w-fit font-sans-premium text-xs font-medium tracking-wider uppercase"
                    >
                      <span className="relative z-10">Private Access</span>
                      <div className="absolute inset-0 bg-white/5 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                    </Link>
                  </div>
                  
                  {/* Stats row */}
                  <div className="flex gap-8 pt-12">
                    <div className="space-y-1">
                      <div className="font-serif-premium text-2xl font-light text-white">14+</div>
                      <div className="font-sans-premium text-[9px] tracking-[0.3em] text-stone-400 uppercase">Years of Craft</div>
                    </div>
                    <div className="w-px h-10 bg-stone-600/50" />
                    <div className="space-y-1">
                      <div className="font-serif-premium text-2xl font-light text-white">420+</div>
                      <div className="font-sans-premium text-[9px] tracking-[0.3em] text-stone-400 uppercase">Pieces Delivered</div>
                    </div>
                    <div className="w-px h-10 bg-stone-600/50" />
                    <div className="space-y-1">
                      <div className="font-serif-premium text-2xl font-light text-white">01</div>
                      <div className="font-sans-premium text-[9px] tracking-[0.3em] text-stone-400 uppercase">Atelier</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="w-full px-6 md:px-12 pb-8 mt-auto">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] text-stone-500 tracking-wider border-t border-white/5 pt-6">
                <p className="font-sans-premium">© 2026 ANNIE'S FASHION HOUSE — ALL RIGHTS RESERVED</p>
                <div className="flex gap-6 font-sans-premium">
                  <span className="hover:text-white transition-colors cursor-pointer">INSTAGRAM</span>
                  <span className="hover:text-white transition-colors cursor-pointer">PINTEREST</span>
                  <span className="hover:text-white transition-colors cursor-pointer">CONTACT</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="hidden lg:flex absolute bottom-8 right-12 z-20 flex-col items-center gap-2">
          <span className="font-sans-premium text-[8px] tracking-[0.5em] text-stone-500 uppercase writing-vertical-rl rotate-180">Scroll</span>
          <div className="w-px h-16 bg-gradient-to-b from-stone-500 to-transparent">
            <div className="w-px h-8 bg-white/50 animate-[scroll_2s_ease-in-out_infinite]" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scroll {
          0%, 100% { transform: translateY(0); opacity: 0.3; }
          50% { transform: translateY(100%); opacity: 1; }
        }
        
        @keyframes letterReveal {
          0% {
            opacity: 0;
            transform: translateY(30px) rotateX(-90deg);
          }
          100% {
            opacity: 1;
            transform: translateY(0) rotateX(0);
          }
        }
        
        .letter-visible {
          animation: letterReveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 4px;
        }
        
        ::-webkit-scrollbar-track {
          background: #1a1a1a;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #4a4a4a;
          border-radius: 2px;
        }
        
        /* Selection color */
        ::selection {
          background: rgba(196,165,116,0.3);
          color: white;
        }
        
        /* Writing mode utility */
        .writing-vertical-rl {
          writing-mode: vertical-rl;
        }
        
        .rotate-180 {
          transform: rotate(180deg);
        }
      `}</style>
    </>
  );
}