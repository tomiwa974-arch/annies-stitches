import { useState } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import { TailoringBackground } from '../components/TailoringBackground';

export default function ForgotPassword() {
  const { data, setData, post, processing, errors } = useForm({
    email: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post("/forgot-password", {
      onSuccess: () => setSubmitted(true),
    });
  };

  return (
    <>
      <Head title="Forgot Password | Annie's Stitches" />

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
              Forgot your<br />password?
            </h2>
            <p className="text-4xl font-bold tracking-tight text-stone-300">
              no worries
            </p>
            <div className="w-20 h-px bg-stone-600" />
            <p className="text-stone-400 text-sm leading-relaxed max-w-md">
              We'll send you a reset link to get back into your account.
            </p>
          </div>
          
          <div className="relative text-xs text-stone-600">
            © 2026 ANNIE'S STITCHES
          </div>
        </div>

        {/* Right side - Forgot Password Form */}
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
              <h2 className="text-3xl md:text-4xl font-light mb-2">Reset password</h2>
              <p className="text-stone-400 text-sm">
                {submitted 
                  ? "Check your email for the reset link" 
                  : "Enter your email to receive a reset link"}
              </p>
            </div>
            
            {submitted ? (
              <div className="bg-stone-900/50 border border-stone-800 rounded-lg p-6 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-900/30 border border-green-800 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-stone-300">
                  Reset link sent to <span className="text-white font-medium">{data.email}</span>
                </p>
                <p className="text-xs text-stone-500">
                  Didn't receive it? Check your spam folder or try again.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-xs text-stone-400 tracking-wide">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    value={data.email}
                    onChange={(e) => setData("email", e.target.value)}
                    className={`w-full bg-transparent border-b py-3 text-white focus:outline-none focus:border-white transition-colors duration-300 ${
                      errors.email ? "border-red-500" : "border-stone-700"
                    }`}
                    placeholder="name@example.com"
                    required
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full py-4 bg-white text-black rounded-full text-sm font-medium tracking-wide hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? "SENDING..." : "SEND RESET LINK"}
                </button>
              </form>
            )}
            
            {/* Back to login link */}
            <p className="text-center text-sm text-stone-400">
              <Link href="/login" className="text-white hover:underline inline-flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}