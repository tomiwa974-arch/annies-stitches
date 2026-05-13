import { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { TailoringBackground } from '../components/TailoringBackground';

export default function Register() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirmation: "",
    agreeTerms: false
  });
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    passwordConfirmation?: string;
    agreeTerms?: string;
    general?: string;
  }>({});

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

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }
    
    if (!formData.email) {
      newErrors.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    if (!formData.passwordConfirmation) {
      newErrors.passwordConfirmation = "Please confirm your password";
    } else if (formData.password !== formData.passwordConfirmation) {
      newErrors.passwordConfirmation = "Passwords do not match";
    }
    
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = "You must agree to the Terms of Service";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});

    try {
      const redirectUrl = getRedirectUrl();
      
      await router.post('/register', 
        {
          name: formData.name.trim(),
          email: formData.email.toLowerCase().trim(),
          password: formData.password,
          password_confirmation: formData.passwordConfirmation,
        },
        {
          onSuccess: () => {
            // Registration successful - user is now logged in
            // Clear any pending action session data for store.tsx
            const pendingAction = sessionStorage.getItem('pendingAction');
            if (pendingAction) {
              // Keep pending action for store.tsx to process
              // Don't remove it here - store.tsx will handle it
            }
            router.visit(redirectUrl);
          },
          onError: (error) => {
            console.error('Registration error:', error);
            if (typeof error === 'object' && error !== null) {
              // Handle field-specific errors from backend
              if (error.email) {
                setErrors(prev => ({ ...prev, email: error.email }));
              } else if (error.name) {
                setErrors(prev => ({ ...prev, name: error.name }));
              } else if (error.password) {
                setErrors(prev => ({ ...prev, password: error.password }));
              } else if (error.message) {
                setErrors(prev => ({ ...prev, general: error.message }));
              } else {
                setErrors(prev => ({ ...prev, general: "Registration failed. Please try again." }));
              }
            } else {
              setErrors(prev => ({ ...prev, general: "An unexpected error occurred. Please try again." }));
            }
          },
          onFinish: () => {
            setIsSubmitting(false);
          }
        }
      );
    } catch (error) {
      console.error('Registration submission error:', error);
      setErrors({ general: "An unexpected error occurred. Please try again." });
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head title="Create Account | Annie's Stitches" />

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
              Begin your<br />journey with
            </h2>
            <p className="text-4xl font-bold tracking-tight text-stone-300">
              style
            </p>
            <div className="w-20 h-px bg-stone-600" />
            <p className="text-stone-400 text-sm leading-relaxed max-w-md">
              Join Annie's Stitches and discover a world of thoughtfully crafted pieces designed to reflect your unique individuality.
            </p>
          </div>
          
          <div className="relative text-xs text-stone-600">
            © 2026 ANNIE'S STITCHES
          </div>
        </div>

        {/* Right side - Registration Form */}
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
              <h2 className="text-3xl md:text-4xl font-light mb-2">Create Account</h2>
              <p className="text-stone-400 text-sm">Join our community of style enthusiasts</p>
            </div>
            
            {/* General Error Message */}
            {errors.general && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-400 text-xs text-center">{errors.general}</p>
              </div>
            )}
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-xs text-stone-400 tracking-wide">FULL NAME</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({...formData, name: e.target.value});
                    if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
                  }}
                  className={`w-full bg-transparent border-b py-3 text-white focus:outline-none focus:border-white transition-colors duration-300 ${
                    errors.name ? 'border-red-500' : 'border-stone-700'
                  }`}
                  placeholder="John Smith"
                  required
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="text-red-400 text-xs mt-1">{errors.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="block text-xs text-stone-400 tracking-wide">EMAIL ADDRESS</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({...formData, email: e.target.value});
                    if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  className={`w-full bg-transparent border-b py-3 text-white focus:outline-none focus:border-white transition-colors duration-300 ${
                    errors.email ? 'border-red-500' : 'border-stone-700'
                  }`}
                  placeholder="name@example.com"
                  required
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-red-400 text-xs mt-1">{errors.email}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="block text-xs text-stone-400 tracking-wide">PASSWORD</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({...formData, password: e.target.value});
                    if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                    // Clear password confirmation error when password changes
                    if (errors.passwordConfirmation) setErrors(prev => ({ ...prev, passwordConfirmation: undefined }));
                  }}
                  className={`w-full bg-transparent border-b py-3 text-white focus:outline-none focus:border-white transition-colors duration-300 ${
                    errors.password ? 'border-red-500' : 'border-stone-700'
                  }`}
                  placeholder="••••••••"
                  required
                  disabled={isSubmitting}
                />
                {errors.password && (
                  <p className="text-red-400 text-xs mt-1">{errors.password}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="block text-xs text-stone-400 tracking-wide">CONFIRM PASSWORD</label>
                <input
                  type="password"
                  value={formData.passwordConfirmation}
                  onChange={(e) => {
                    setFormData({...formData, passwordConfirmation: e.target.value});
                    if (errors.passwordConfirmation) setErrors(prev => ({ ...prev, passwordConfirmation: undefined }));
                  }}
                  className={`w-full bg-transparent border-b py-3 text-white focus:outline-none focus:border-white transition-colors duration-300 ${
                    errors.passwordConfirmation ? 'border-red-500' : 'border-stone-700'
                  }`}
                  placeholder="••••••••"
                  required
                  disabled={isSubmitting}
                />
                {errors.passwordConfirmation && (
                  <p className="text-red-400 text-xs mt-1">{errors.passwordConfirmation}</p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={(e) => {
                    setFormData({...formData, agreeTerms: e.target.checked});
                    if (errors.agreeTerms) setErrors(prev => ({ ...prev, agreeTerms: undefined }));
                  }}
                  className="w-4 h-4 bg-transparent border border-stone-600 rounded focus:ring-0"
                  required
                  disabled={isSubmitting}
                />
                <span className="text-xs text-stone-400">
                  I agree to the{' '}
                  <Link href="/terms" className="text-white hover:underline">Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="text-white hover:underline">Privacy Policy</Link>
                </span>
              </div>
              {errors.agreeTerms && (
                <p className="text-red-400 text-xs mt-1">{errors.agreeTerms}</p>
              )}
              
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 bg-white text-black rounded-full text-sm font-medium tracking-wide transition-all duration-500 mt-6 ${
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
                    CREATING ACCOUNT...
                  </span>
                ) : (
                  'CREATE ACCOUNT'
                )}
              </button>
            </form>
            
            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-800"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-4 bg-black/40 text-stone-400">or sign up with</span>
              </div>
            </div>
            
            {/* Social signup */}
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
            
            {/* Sign in link */}
            <p className="text-center text-sm text-stone-400">
              Already have an account?{' '}
              <Link href="/login" className="text-white hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}