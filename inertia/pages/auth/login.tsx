import { useState } from "react";
import { Head, Link, usePage, router } from "@inertiajs/react";
import { TailoringBackground } from '../components/TailoringBackground';

export default function Login() {
  const { errors } = usePage().props as any;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false
  });
  const [serverError, setServerError] = useState<string | null>(null);

  // Get the redirect URL from sessionStorage or query params
  const getRedirectUrl = (): string => {
    // Check sessionStorage first (set by store.tsx)
    const storedRedirect = sessionStorage.getItem('redirectAfterLogin');
    if (storedRedirect) {
      sessionStorage.removeItem('redirectAfterLogin');
      return storedRedirect;
    }
    
    // Check URL params as fallback
    const urlParams = new URLSearchParams(window.location.search);
    const redirectParam = urlParams.get('redirect');
    if (redirectParam) {
      return redirectParam;
    }
    
    // Default redirect to store
    return '/store';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setServerError(null);

    try {
      const redirectUrl = getRedirectUrl();
      
      await router.post('/login', 
        {
          email: formData.email,
          password: formData.password,
          remember: formData.remember,
        },
        {
          onSuccess: () => {
            // Clear any pending action session data
            const pendingAction = sessionStorage.getItem('pendingAction');
            if (pendingAction) {
              // Keep pending action for store.tsx to process
              // Don't remove it here - store.tsx will handle it
            }
            router.visit(redirectUrl);
          },
          onError: (error) => {
            console.error('Login error:', error);
            if (error.message) {
              setServerError(error.message);
            } else if (error.errors) {
              // Handle validation errors from backend
              const errorMessages = Object.values(error.errors).flat();
              setServerError(errorMessages[0] as string || 'Login failed. Please check your credentials.');
            } else {
              setServerError('Invalid email or password. Please try again.');
            }
          },
          onFinish: () => {
            setIsSubmitting(false);
          }
        }
      );
    } catch (error) {
      console.error('Login submission error:', error);
      setServerError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head title="Sign In | Annie's Stitches" />

      <div className="min-h-screen bg-black text-white font-sans flex relative overflow-hidden">
        
        {/* Tailoring Background */}
        <TailoringBackground />
        
        {/* Dark overlay for better contrast */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-[1]" />

        {/* Left side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 p-16 flex-col justify-between relative z-10">
          {/* Decorative elements */}
          <div className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '50px 50px'
            }}
          />
          
          <div className="relative">
            <Link href="/" className="text-2xl font-light tracking-[0.3em] text-white">
              ANNIE'S
            </Link>
          </div>
          
          <div className="relative space-y-8">
            <h2 className="text-6xl font-light leading-tight">
              Welcome<br />back to
            </h2>
            <p className="text-4xl font-bold tracking-tight text-stone-300">
              elegance
            </p>
            <div className="w-20 h-px bg-stone-600" />
            <p className="text-stone-400 text-sm leading-relaxed max-w-md">
              Sign in to continue your journey with Annie's Stitches — where every piece tells a story.
            </p>
          </div>
          
          <div className="relative text-xs text-stone-600">
            © 2026 ANNIE'S STITCHES
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 relative z-10">
          <div className="w-full max-w-md space-y-8 bg-black/40 backdrop-blur-sm p-8 rounded-2xl border border-stone-800/50">
            
            {/* Mobile brand (visible on small screens) */}
            <div className="lg:hidden text-center mb-8">
              <Link href="/" className="text-xl tracking-[0.3em] text-white">
                ANNIE'S
              </Link>
            </div>
            
            {/* Header */}
            <div className="text-center lg:text-left">
              <h2 className="text-3xl md:text-4xl font-light mb-2">Sign In</h2>
              <p className="text-stone-400 text-sm">Please enter your details to continue</p>
            </div>
            
            {/* Error Message Display */}
            {serverError && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-400 text-xs text-center">{serverError}</p>
              </div>
            )}
            
            {errors?.email && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-400 text-xs text-center">{errors.email}</p>
              </div>
            )}
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-xs text-stone-400 tracking-wide">EMAIL ADDRESS</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-transparent border-b border-stone-700 py-3 text-white focus:outline-none focus:border-white transition-colors duration-300"
                  placeholder="name@example.com"
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-xs text-stone-400 tracking-wide">PASSWORD</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-transparent border-b border-stone-700 py-3 text-white focus:outline-none focus:border-white transition-colors duration-300"
                  placeholder="••••••••"
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.remember}
                    onChange={(e) => setFormData({...formData, remember: e.target.checked})}
                    className="w-4 h-4 bg-transparent border border-stone-600 rounded focus:ring-0"
                    disabled={isSubmitting}
                  />
                  <span className="text-xs text-stone-400">Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-xs text-stone-400 hover:text-white transition">
                  Forgot password?
                </Link>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 bg-white text-black rounded-full text-sm font-medium tracking-wide transition-all duration-500 ${
                  isSubmitting 
                    ? 'opacity-70 cursor-not-allowed' 
                    : 'hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    SIGNING IN...
                  </span>
                ) : (
                  'SIGN IN'
                )}
              </button>
            </form>
            
            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-800"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-4 bg-black/40 text-stone-400">or continue with</span>
              </div>
            </div>
            
            {/* Social login */}
            <div className="grid grid-cols-3 gap-4">
              <button className="py-3 border border-stone-800 rounded-full hover:border-white transition-colors duration-300">
                <span className="text-lg">G</span>
              </button>
              <button className="py-3 border border-stone-800 rounded-full hover:border-white transition-colors duration-300">
                <span className="text-lg">f</span>
              </button>
              <button className="py-3 border border-stone-800 rounded-full hover:border-white transition-colors duration-300">
                <span className="text-lg">in</span>
              </button>
            </div>
            
            {/* Sign up link */}
            <p className="text-center text-sm text-stone-400">
              Don't have an account?{' '}
              <Link href="/register" className="text-white hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}