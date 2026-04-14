'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginWithPassword, requestEmailOtp, verifyEmailOtp } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const saveUserAndRedirect = (user: any) => {
    localStorage.setItem(
      'excito_user',
      JSON.stringify({
        id: user.id,
        email: user.email,
        firstName: user.first_name || user.firstName || '',
      })
    );
    window.dispatchEvent(new Event('excito-auth-changed'));
    router.push('/');
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const data = await loginWithPassword({ email, password });
      saveUserAndRedirect(data.user);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      await requestEmailOtp(email);
      setOtpSent(true);
      setInfo('OTP sent to your email. Please check your inbox.');
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const data = await verifyEmailOtp(email, otp);
      saveUserAndRedirect(data.user);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'OTP verification failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden bg-gray-950">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black" />
        {/* Animated circles */}
        <div className="absolute top-20 left-16 w-72 h-72 border border-white/10 rounded-full" />
        <div className="absolute top-40 left-8 w-40 h-40 border border-white/5 rounded-full" />
        <div className="absolute bottom-24 right-10 w-56 h-56 border border-white/10 rounded-full" />

        <div className="relative z-10 flex flex-col justify-between p-14 w-full">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-white font-black text-3xl tracking-widest" style={{ fontFamily: 'Georgia, serif' }}>
              EXCITO
            </span>
          </Link>

          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-white leading-tight">
              Style is a way<br />to say who you<br />are without speaking.
            </h2>
            <p className="text-gray-400 text-lg max-w-xs">
              Join thousands of style-conscious shoppers on Excito.
            </p>

            <div className="flex items-center space-x-4 pt-4">
              <div className="flex -space-x-2">
                {['bg-pink-400', 'bg-blue-400', 'bg-yellow-400', 'bg-green-400'].map((c, i) => (
                  <div key={i} className={`w-8 h-8 rounded-full ${c} border-2 border-gray-900`} />
                ))}
              </div>
              <p className="text-gray-400 text-sm">10,000+ happy customers</p>
            </div>
          </div>

          <p className="text-gray-600 text-xs">© 2026 Excito. All rights reserved.</p>
        </div>
      </div>

      {/* Right — Form */}
      <div className="w-full lg:w-7/12 flex items-center justify-center px-6 py-12 animate-section-in" style={{ animationDelay: '60ms' }}>
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-10">
            <Link href="/" className="text-2xl font-black text-black dark:text-white tracking-widest">EXCITO</Link>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Welcome back</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Sign in with password or secure OTP</p>
          </div>

          {/* Social login buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button className="flex items-center justify-center space-x-2 border border-gray-200 dark:border-gray-800 rounded-xl py-2.5 px-4 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Google</span>
            </button>
            <button className="flex items-center justify-center space-x-2 border border-gray-200 dark:border-gray-800 rounded-xl py-2.5 px-4 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span>Facebook</span>
            </button>
          </div>

          <div className="flex items-center space-x-3 mb-6">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">choose login mode</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
          </div>

          <div className="grid grid-cols-2 gap-2 mb-5 bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setMode('password');
                setError('');
                setInfo('');
              }}
              className={`py-2.5 rounded-lg text-sm font-semibold transition-colors ${mode === 'password' ? 'bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100' : 'text-gray-500'}`}
            >
              Email + Password
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('otp');
                setError('');
                setInfo('');
              }}
              className={`py-2.5 rounded-lg text-sm font-semibold transition-colors ${mode === 'otp' ? 'bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100' : 'text-gray-500'}`}
            >
              Email + OTP
            </button>
          </div>

          {info && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-200 text-sm">
              {info}
            </div>
          )}

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-200 text-sm flex items-center space-x-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {mode === 'password' ? (
            <form onSubmit={handlePasswordLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-gray-900 dark:focus:border-gray-200 focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Your password"
                  className="w-full border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-gray-900 dark:focus:border-gray-200 focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10 transition-all"
                />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-gray-900 text-white font-semibold py-3 rounded-xl text-sm hover:bg-gray-700 active:bg-black transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={otpSent ? handleVerifyOtp : handleRequestOtp} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-gray-900 dark:focus:border-gray-200 focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10 transition-all"
                />
              </div>

              {otpSent && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Enter OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    placeholder="6-digit OTP"
                    className="w-full border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-gray-900 dark:focus:border-gray-200 focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10 transition-all"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 text-white font-semibold py-3 rounded-xl text-sm hover:bg-gray-700 active:bg-black transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Please wait...' : otpSent ? 'Verify OTP & Sign In' : 'Send OTP'}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-semibold text-gray-900 dark:text-gray-100 hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
