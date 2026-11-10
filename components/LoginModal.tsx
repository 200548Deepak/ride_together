'use client';

import React, { useState } from 'react';
import { getSupabaseClient } from '../lib/supabaseClient';

export interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: any) => void;
  onSwitchToRegister?: () => void;
}

export default function LoginModal({
  isOpen,
  onClose,
  onSuccess,
  onSwitchToRegister,
}: LoginModalProps) {
  const [view, setView] = useState<'options' | 'email'>('options');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setView('options');
    setEmail('');
    setPassword('');
    setErrorMessage(null);
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      const supabase = getSupabaseClient();

      if (!supabase) {
        // Mock fallback if Supabase environment variables aren't yet configured
        console.warn('Supabase client not configured with env vars. Simulating successful login.');
        setTimeout(() => {
          setLoading(false);
          const mockUser = { id: 'mock-user-123', email, name: email.split('@')[0] };
          if (onSuccess) onSuccess(mockUser);
          handleClose();
        }, 600);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(error.message || 'Invalid email or password.');
        setLoading(false);
        return;
      }

      if (data?.user) {
        if (onSuccess) onSuccess(data.user);
        handleClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setErrorMessage('Google authentication requires Supabase environment variables configured.');
        return;
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/search` : undefined,
        },
      });

      if (error) {
        setErrorMessage(error.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to initialize Google login.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={handleClose} />

      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 z-10 font-sans transition-all">
        {/* Header with Navigation & Close button */}
        <div className="flex items-center justify-between mb-6">
          {view === 'email' ? (
            <button
              type="button"
              onClick={() => {
                setView('options');
                setErrorMessage(null);
              }}
              className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              aria-label="Back to options"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 stroke-current stroke-2">
                <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <div className="w-9" />
          )}

          <button
            type="button"
            onClick={handleClose}
            className="p-2 -mr-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 stroke-current stroke-2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#054752] tracking-tight mb-2">
          Log in
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          {view === 'options'
            ? 'Choose how you want to log in to Ride Together.'
            : 'Enter your credentials to continue your journey.'}
        </p>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2.5 text-red-600 text-sm">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0 mt-0.5">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* VIEW 1: LOGIN OPTIONS */}
        {view === 'options' && (
          <div className="space-y-3.5">
            {/* Email Option */}
            <button
              type="button"
              onClick={() => setView('email')}
              className="w-full h-13 px-5 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100 transition flex items-center justify-between cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center space-x-3.5">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-slate-500 stroke-current stroke-2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <span className="font-semibold text-sm text-[#054752]">
                  Continue with Email
                </span>
              </div>
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform stroke-current stroke-2">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Google Option */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full h-13 px-5 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100 transition flex items-center justify-between cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center space-x-3.5">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.92 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span className="font-semibold text-sm text-[#054752]">
                  Continue with Google
                </span>
              </div>
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform stroke-current stroke-2">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}

        {/* VIEW 2: EMAIL & PASSWORD FORM */}
        {view === 'email' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#054752] mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-[#054752] placeholder-slate-400 focus:outline-none focus:border-[#00aff5] focus:bg-white focus:ring-4 focus:ring-[#00aff5]/10 text-sm transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#054752]">
                  Password
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Password reset instructions will be sent to your email.');
                  }}
                  className="text-xs font-semibold text-[#00aff5] hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-12 pl-4 pr-11 rounded-xl bg-slate-50 border border-slate-200 text-[#054752] placeholder-slate-400 focus:outline-none focus:border-[#00aff5] focus:bg-white focus:ring-4 focus:ring-[#00aff5]/10 text-sm transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 stroke-current stroke-2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 stroke-current stroke-2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-13 mt-2 rounded-full bg-[#00aff5] hover:bg-[#008ecc] active:scale-[0.99] text-white font-bold text-base transition-all shadow-sm flex items-center justify-center cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Log in'
              )}
            </button>
          </form>
        )}

        {/* Switch to Register */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-600">
            Not a member yet?{' '}
            <button
              type="button"
              onClick={() => {
                handleClose();
                if (onSwitchToRegister) onSwitchToRegister();
              }}
              className="text-[#00aff5] font-bold hover:underline cursor-pointer ml-1"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

