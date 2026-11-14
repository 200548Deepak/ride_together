'use client';

import React, { useState, useEffect } from 'react';
import { setAuth, AuthUser } from '@/lib/authClient';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onSuccess?: (user: AuthUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'passenger' | 'driver'>('passenger');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
    setErrorMessage(null);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  // Password validation checks (BlaBlaCar replica)
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumberOrSpecial = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const isPasswordValid = hasMinLength && hasLetter && hasNumberOrSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'register') {
        if (!name.trim()) {
          throw new Error('Please enter your full name.');
        }
        if (!email.trim() || !email.includes('@')) {
          throw new Error('Please enter a valid email address.');
        }
        if (!isPasswordValid) {
          throw new Error('Please ensure your password meets all requirements.');
        }

        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
            role
          })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to register account.');
        }

        setAuth(data.user, data.token);
        if (onSuccess) onSuccess(data.user);
        onClose();
      } else {
        // Login mode
        if (!email.trim() || !password) {
          throw new Error('Please enter your email and password.');
        }

        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            password
          })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Invalid email or password.');
        }

        setAuth(data.user, data.token);
        if (onSuccess) onSuccess(data.user);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Navigation Bar with Step Indicator */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-gray-100">
          <button
            type="button"
            onClick={() => {
              if (mode === 'register') setMode('login');
              else onClose();
            }}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-slate-100 text-[#708c91] transition-colors"
            aria-label="Back"
          >
            <svg className="w-5 h-5 text-[#054752]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* BlaBlaCar 5 Progress Dots */}
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00aff5]" />
            <span className="w-2 h-2 rounded-full bg-[#00aff5]" />
            <span className="w-2 h-2 rounded-full bg-[#00aff5]" />
            <span className="w-2 h-2 rounded-full bg-[#00aff5]" />
            <span className={`h-2 rounded-full transition-all ${mode === 'register' ? 'w-6 bg-[#00aff5]' : 'w-2 bg-slate-300'}`} />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 -mr-1.5 rounded-full hover:bg-slate-100 text-[#708c91] transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5 text-[#054752]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-5">
          {/* Heading */}
          <div>
            <h2 className="text-3xl font-black text-[#054752] tracking-tight">
              {mode === 'register' ? 'Define your password' : 'Log in to Ride Together'}
            </h2>
            <p className="text-[#708c91] text-sm mt-1 font-medium">
              {mode === 'register'
                ? 'Create a secure password to protect your account.'
                : 'Enter your email and password to access your rides.'}
            </p>
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'login' ? 'bg-white text-[#054752] shadow-xs' : 'text-[#708c91] hover:text-[#054752]'
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'register' ? 'bg-white text-[#054752] shadow-xs' : 'text-[#708c91] hover:text-[#054752]'
              }`}
            >
              Sign up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#054752] mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anish Kumar"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl bg-[#f4f7f8] border-2 border-transparent focus:border-[#00aff5] focus:bg-white text-[#054752] font-semibold text-sm transition-all outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#054752] mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-[#f4f7f8] border-2 border-transparent focus:border-[#00aff5] focus:bg-white text-[#054752] font-semibold text-sm transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#054752] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 pr-12 rounded-2xl bg-[#f4f7f8] border-2 border-transparent focus:border-[#00aff5] focus:bg-white text-[#054752] font-semibold text-sm transition-all outline-none tracking-widest"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#708c91] hover:text-[#054752] transition-colors p-1"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* BlaBlaCar Password Requirements Box (Shown during Sign up) */}
            {mode === 'register' && (
              <div className="p-4 rounded-2xl bg-[#f8fafb] border border-slate-100 space-y-2 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black ${
                    hasMinLength ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                  }`}>
                    ✓
                  </span>
                  <span className={hasMinLength ? 'text-[#054752]' : 'text-[#708c91]'}>
                    At least 8 characters
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black ${
                    hasLetter ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                  }`}>
                    ✓
                  </span>
                  <span className={hasLetter ? 'text-[#054752]' : 'text-[#708c91]'}>
                    At least 1 letter
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black ${
                    hasNumberOrSpecial ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                  }`}>
                    ✓
                  </span>
                  <span className={hasNumberOrSpecial ? 'text-[#054752]' : 'text-[#708c91]'}>
                    At least 1 number or special character
                  </span>
                </div>
              </div>
            )}

            {/* Role selector (Sign up mode) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#054752] mb-1.5">
                  Account Type
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setRole('passenger')}
                    className={`p-3 rounded-2xl border font-bold text-center transition-all ${
                      role === 'passenger'
                        ? 'border-[#00aff5] bg-cyan-50/70 text-[#00aff5]'
                        : 'border-slate-200 bg-white text-[#708c91] hover:border-slate-300'
                    }`}
                  >
                    🎒 Passenger (Book Rides)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('driver')}
                    className={`p-3 rounded-2xl border font-bold text-center transition-all ${
                      role === 'driver'
                        ? 'border-[#00aff5] bg-cyan-50/70 text-[#00aff5]'
                        : 'border-slate-200 bg-white text-[#708c91] hover:border-slate-300'
                    }`}
                  >
                    🚗 Driver (Host Rides)
                  </button>
                </div>
              </div>
            )}

            {/* Error banner */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <span className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">!</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Legal terms disclaimer */}
            <p className="text-[11px] text-[#708c91] leading-relaxed">
              By signing up, you accept our{' '}
              <span className="text-[#00aff5] font-semibold hover:underline cursor-pointer">Terms and Conditions</span> and
              acknowledge our{' '}
              <span className="text-[#00aff5] font-semibold hover:underline cursor-pointer">Privacy Policy</span>.
            </p>

            {/* Primary Action Button (BlaBlaCar Cyan Pill) */}
            <button
              type="submit"
              disabled={isLoading || (mode === 'register' && !isPasswordValid)}
              className="w-full py-4 rounded-full bg-[#00aff5] hover:bg-[#0098d6] disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-extrabold text-base shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Processing...</span>
                </>
              ) : (
                <span>{mode === 'register' ? 'Done' : 'Log in'}</span>
              )}
            </button>
          </form>

          {/* Quick Demo Switcher helper */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-[#708c91]">
            <span>Quick demo accounts:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('driver@abc.com');
                  setPassword('password123');
                  setMode('login');
                }}
                className="text-[#00aff5] font-bold hover:underline"
              >
                Driver
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  setEmail('rider@abc.com');
                  setPassword('password123');
                  setMode('login');
                }}
                className="text-[#00aff5] font-bold hover:underline"
              >
                Rider
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
