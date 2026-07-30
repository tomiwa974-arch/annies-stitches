import { useState, useRef, useEffect } from "react";
import { Link } from "@inertiajs/react";

interface UserDashboardLayoutProps {
  children: React.ReactNode;
  topCategories: Array<{
    name: string;
    link: string;
    onClick?: () => void;
  }>;
  isBlurred: boolean;
}

export default function UserDashboardLayout({
  children,
  topCategories,
  isBlurred,
}: UserDashboardLayoutProps) {
  const [isSticky, setIsSticky] = useState(false);
  const stickyTriggerRef = useRef<HTMLDivElement>(null);

  // Handle sticky scroll
  useEffect(() => {
    const handleScroll = () => {
      if (stickyTriggerRef.current) {
        const triggerRect = stickyTriggerRef.current.getBoundingClientRect();
        const shouldBeSticky = triggerRect.top <= 0;
        
        if (shouldBeSticky !== isSticky) {
          setIsSticky(shouldBeSticky);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isSticky]);

  // Pill navigation component
  const PillNavigation = () => (
    <nav className="flex justify-between w-full max-w-7xl mx-auto">
      {topCategories.map((category, index) => (
        category.onClick ? (
          <button
            key={index}
            onClick={(e) => {
              e.preventDefault();
              category.onClick?.();
            }}
            className="text-xs border border-white/30 px-6 py-2 rounded-full hover:bg-white hover:text-black transition duration-300 whitespace-nowrap bg-white/10 backdrop-blur-md"
            type="button"
          >
            {category.name}
          </button>
        ) : (
          <Link
            key={index}
            href={category.link}
            className="text-xs border border-white/30 px-6 py-2 rounded-full hover:bg-white hover:text-black transition duration-300 whitespace-nowrap bg-white/10 backdrop-blur-md"
          >
            {category.name}
          </Link>
        )
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden flex flex-col relative">
      {/* Top hero background */}
      <div 
        className="absolute inset-x-0 top-0 h-[680px] bg-cover bg-center bg-no-repeat transition-all duration-700 z-0"
        style={{
          backgroundImage: `url('/images/annies studio.png')`,
        }}
      />
      
      {/* Blur Overlay */}
      <div 
        className={`absolute inset-x-0 top-0 h-[680px] transition-all duration-700 z-[1] ${
          isBlurred 
            ? 'bg-black/40 backdrop-blur-md' 
            : 'bg-black/50 backdrop-blur-[1px]'
        }`}
      />

      {/* Sticky Pill Navigation */}
      <div className={`w-full px-6 md:px-12 transition-all duration-300 z-20 relative ${
        isSticky 
          ? 'fixed top-0 left-0 right-0 z-50 py-3 bg-black/80 backdrop-blur-md' 
          : 'relative mt-4'
      }`}>
        <div className="max-w-7xl mx-auto">
          <PillNavigation />
        </div>
      </div>

      <div ref={stickyTriggerRef} className="h-0" />
      {isSticky && <div className="h-16" />}

      {/* Page Content */}
      {children}
    </div>
  );
}
