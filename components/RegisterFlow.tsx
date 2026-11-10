'use client';

import React, { useState } from 'react';
import { getSupabaseClient } from '../lib/supabaseClient';

export interface RegisterFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: any) => void;
  onSwitchToLogin?: () => void;
}

export type GenderOption = 'MALE' | 'FEMALE' | 'NOT_SPECIFIED';

export default function RegisterFlow({
  isOpen,
  onClose,
  onSuccess,
  onSwitchToLogin,
}: RegisterFlowProps) {
  // Steps: 1: Email, 2: Name, 3: Birthdate, 4: Gender, 5: Password
  const [step, setStep] = useState<number>(1);

  // Form State
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [gender, setGender] = useState<GenderOption>('NOT_SPECIFIED');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // UI State
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalSteps = 5;

  const handleClose = () => {
    setStep(1);
    setEmail('');
    setFirstName('');
    setLastName('');
    setDay('');
    setMonth('');
    setYear('');
    setGender('NOT_SPECIFIED');
    setPassword('');
    setErrorMessage(null);
    setLoading(false);
    onClose();
  };

  const handleBack = () => {
    setErrorMessage(null);
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  // Step 1 Validation (Email)
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    setStep(2);
  };

  // Step 2 Validation (Name)
  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('Please enter both your first name and last name.');
      return;
    }
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      setErrorMessage('First and last names must each have at least 2 characters.');
      return;
    }
    setStep(3);
  };

  // Step 3 Validation (Date of Birth)
  const handleBirthDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    if (isNaN(d) || isNaN(m) || isNaN(y) || d < 1 || d > 31 || m < 1 || m > 12 || y < 1920 || y > 2026) {
      setErrorMessage('Please enter a valid date of birth.');
      return;
    }

    const birthDateObj = new Date(y, m - 1, d);
    const today = new Date();
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const mDiff = today.getMonth() - birthDateObj.getMonth();
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }

    if (age < 18) {
      setErrorMessage('You must be at least 18 years old to join Ride Together.');
      return;
    }

    setStep(4);
  };

  // Step 4 Validation (Gender/Title)
  const handleGenderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStep(5);
  };

  // Step 5 Validation & Complete Registration (Password)
  const handleFinalRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const hasMinLength = password.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

    if (!hasMinLength || !hasLetter || !hasNumberOrSymbol) {
      setErrorMessage('Please ensure your password meets all requirements.');
      return;
    }

    setLoading(true);

    const formattedBirthDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    try {
      const supabase = getSupabaseClient();

      if (!supabase) {
        // Mock fallback if Supabase environment variables aren't yet configured
        console.warn('Supabase client not configured. Simulating successful registration.');
        setTimeout(() => {
          setLoading(false);
          const mockUser = {
            id: 'mock-new-user-456',
            email: email.trim(),
            name: fullName,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            birth_date: formattedBirthDate,
            gender,
          };
          if (onSuccess) onSuccess(mockUser);
          handleClose();
        }, 800);
        return;
      }

      // 1. Supabase Auth Sign Up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: fullName,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            birth_date: formattedBirthDate,
            gender,
          },
        },
      });

      if (authError) {
        setErrorMessage(authError.message || 'Registration failed.');
        setLoading(false);
        return;
      }

      const userId = authData.user?.id;

      if (userId) {
        // 2. Explicitly insert/upsert into public.users table
        const { error: userTableError } = await supabase.from('users').upsert({
          id: userId,
          email: email.trim(),
          name: fullName,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          birth_date: formattedBirthDate,
          gender,
          is_verified: false,
          rating: 5.0,
        });

        if (userTableError) {
          console.warn('Could not insert to public.users directly (trigger may handle it):', userTableError);
        }

        // 3. Also sync into public.profiles for ride listings
        await supabase.from('profiles').upsert({
          id: userId,
          name: fullName,
          is_verified: false,
          rating: 5.0,
        });

        if (onSuccess) onSuccess(authData.user);
        handleClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during account creation.');
    } finally {
      setLoading(false);
    }
  };

  // Password validation indicators
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={handleClose} />

      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 z-10 font-sans transition-all">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-4">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              aria-label="Previous step"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 stroke-current stroke-2">
                <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <div className="w-9" />
          )}

          {/* Step Dots Indicator */}
          <div className="flex items-center space-x-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i + 1 === step
                    ? 'w-6 bg-[#00aff5]'
                    : i + 1 < step
                    ? 'w-2 bg-[#00aff5]/60'
                    : 'w-2 bg-slate-200'
                }`}
              />
            ))}
          </div>

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

        {/* Error Notification */}
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

        {/* STEP 1: EMAIL */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#054752] tracking-tight mb-2">
              What&apos;s your email?
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              We&apos;ll send your ride confirmations and receipts here.
            </p>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  autoFocus
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full h-13 px-4 rounded-xl bg-slate-50 border border-slate-200 text-[#054752] placeholder-slate-400 focus:outline-none focus:border-[#00aff5] focus:bg-white focus:ring-4 focus:ring-[#00aff5]/10 text-base transition"
                />
              </div>

              <button
                type="submit"
                className="w-full h-13 rounded-full bg-[#00aff5] hover:bg-[#008ecc] active:scale-[0.99] text-white font-bold text-base transition-all shadow-sm flex items-center justify-center cursor-pointer"
              >
                Continue
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-600">
                Already a member?{' '}
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    if (onSwitchToLogin) onSwitchToLogin();
                  }}
                  className="text-[#00aff5] font-bold hover:underline cursor-pointer ml-1"
                >
                  Log in
                </button>
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: NAME */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#054752] tracking-tight mb-2">
              What&apos;s your name?
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Enter your name as it appears on your ID so members can recognize you.
            </p>

            <form onSubmit={handleNameSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#054752] mb-1.5">
                  First name
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Rahul"
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-[#054752] placeholder-slate-400 focus:outline-none focus:border-[#00aff5] focus:bg-white focus:ring-4 focus:ring-[#00aff5]/10 text-sm transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#054752] mb-1.5">
                  Last name
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Sharma"
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-[#054752] placeholder-slate-400 focus:outline-none focus:border-[#00aff5] focus:bg-white focus:ring-4 focus:ring-[#00aff5]/10 text-sm transition"
                />
              </div>

              <button
                type="submit"
                className="w-full h-13 mt-4 rounded-full bg-[#00aff5] hover:bg-[#008ecc] active:scale-[0.99] text-white font-bold text-base transition-all shadow-sm flex items-center justify-center cursor-pointer"
              >
                Continue
              </button>
            </form>
          </div>
        )}

        {/* STEP 3: DATE OF BIRTH */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#054752] tracking-tight mb-2">
              What&apos;s your date of birth?
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              You must be at least 18 years old to join Ride Together.
            </p>

            <form onSubmit={handleBirthDateSubmit} className="space-y-6">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#054752] mb-1.5">
                    Day
                  </label>
                  <input
                    type="number"
                    autoFocus
                    required
                    min={1}
                    max={31}
                    value={day}
                    onChange={(e) => setDay(e.target.value.slice(0, 2))}
                    placeholder="DD"
                    className="w-full h-12 text-center rounded-xl bg-slate-50 border border-slate-200 text-[#054752] placeholder-slate-400 focus:outline-none focus:border-[#00aff5] focus:bg-white focus:ring-4 focus:ring-[#00aff5]/10 text-base font-semibold transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#054752] mb-1.5">
                    Month
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={12}
                    value={month}
                    onChange={(e) => setMonth(e.target.value.slice(0, 2))}
                    placeholder="MM"
                    className="w-full h-12 text-center rounded-xl bg-slate-50 border border-slate-200 text-[#054752] placeholder-slate-400 focus:outline-none focus:border-[#00aff5] focus:bg-white focus:ring-4 focus:ring-[#00aff5]/10 text-base font-semibold transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#054752] mb-1.5">
                    Year
                  </label>
                  <input
                    type="number"
                    required
                    min={1920}
                    max={2026}
                    value={year}
                    onChange={(e) => setYear(e.target.value.slice(0, 4))}
                    placeholder="YYYY"
                    className="w-full h-12 text-center rounded-xl bg-slate-50 border border-slate-200 text-[#054752] placeholder-slate-400 focus:outline-none focus:border-[#00aff5] focus:bg-white focus:ring-4 focus:ring-[#00aff5]/10 text-base font-semibold transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-13 rounded-full bg-[#00aff5] hover:bg-[#008ecc] active:scale-[0.99] text-white font-bold text-base transition-all shadow-sm flex items-center justify-center cursor-pointer"
              >
                Continue
              </button>
            </form>
          </div>
        )}

        {/* STEP 4: GENDER / TITLE */}
        {step === 4 && (
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#054752] tracking-tight mb-2">
              How should we address you?
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              This helps fellow members communicate politely.
            </p>

            <form onSubmit={handleGenderSubmit} className="space-y-4">
              <div className="space-y-2.5">
                {[
                  { value: 'MALE' as GenderOption, label: 'Mr.' },
                  { value: 'FEMALE' as GenderOption, label: 'Ms. / Mrs.' },
                  { value: 'NOT_SPECIFIED' as GenderOption, label: "I'd rather not say" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                      gender === opt.value
                        ? 'border-[#00aff5] bg-[#00aff5]/5'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-semibold text-sm text-[#054752]">
                      {opt.label}
                    </span>
                    <input
                      type="radio"
                      name="gender"
                      value={opt.value}
                      checked={gender === opt.value}
                      onChange={() => setGender(opt.value)}
                      className="sr-only"
                    />
                    <span
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        gender === opt.value
                          ? 'border-[#00aff5] bg-[#00aff5]'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {gender === opt.value && (
                        <span className="w-2 h-2 rounded-full bg-white ring-2 ring-[#00aff5]" />
                      )}
                    </span>
                  </label>
                ))}
              </div>

              <button
                type="submit"
                className="w-full h-13 mt-4 rounded-full bg-[#00aff5] hover:bg-[#008ecc] active:scale-[0.99] text-white font-bold text-base transition-all shadow-sm flex items-center justify-center cursor-pointer"
              >
                Continue
              </button>
            </form>
          </div>
        )}

        {/* STEP 5: PASSWORD & SUBMIT */}
        {step === 5 && (
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#054752] tracking-tight mb-2">
              Define your password
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Create a secure password to protect your account.
            </p>

            <form onSubmit={handleFinalRegister} className="space-y-4">
              <div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoFocus
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
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

              {/* Password Requirements Checklist */}
              <div className="p-3.5 bg-slate-50 rounded-xl space-y-2 text-xs">
                <div className="flex items-center space-x-2">
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      hasMinLength ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    ✓
                  </span>
                  <span className={hasMinLength ? 'text-slate-700 font-medium' : 'text-slate-400'}>
                    At least 8 characters
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      hasLetter ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    ✓
                  </span>
                  <span className={hasLetter ? 'text-slate-700 font-medium' : 'text-slate-400'}>
                    At least 1 letter
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      hasNumberOrSymbol ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    ✓
                  </span>
                  <span className={hasNumberOrSymbol ? 'text-slate-700 font-medium' : 'text-slate-400'}>
                    At least 1 number or special character
                  </span>
                </div>
              </div>

              {/* Terms disclaimer */}
              <p className="text-xs text-slate-500 leading-relaxed pt-1">
                By signing up, you accept our{' '}
                <a href="#terms" className="text-[#00aff5] hover:underline font-medium">Terms and Conditions</a>{' '}
                and acknowledge our{' '}
                <a href="#privacy" className="text-[#00aff5] hover:underline font-medium">Privacy Policy</a>.
              </p>

              <button
                type="submit"
                disabled={loading || !hasMinLength || !hasLetter || !hasNumberOrSymbol}
                className="w-full h-13 mt-4 rounded-full bg-[#00aff5] hover:bg-[#008ecc] active:scale-[0.99] text-white font-bold text-base transition-all shadow-sm flex items-center justify-center cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Done'
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

