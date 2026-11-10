'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LoginModal from '../components/LoginModal';
import RegisterFlow from '../components/RegisterFlow';
import { getSupabaseClient } from '../lib/supabaseClient';

const POPULAR_ROUTES = [
  { from: 'Bengaluru', to: 'Mysuru', price: '₹500', time: '2h 10m' },
  { from: 'Bengaluru', to: 'Chennai', price: '₹650', time: '5h 30m' },
  { from: 'Bengaluru', to: 'Hyderabad', price: '₹950', time: '8h 00m' },
  { from: 'Mumbai', to: 'Pune', price: '₹350', time: '2h 45m' },
  { from: 'Delhi', to: 'Jaipur', price: '₹480', time: '4h 15m' },
  { from: 'Coimbatore', to: 'Bengaluru', price: '₹700', time: '6h 15m' }
];

const CITY_SUGGESTIONS = [
  'Bengaluru',
  'Mysuru',
  'Hutagalli',
  'Chennai',
  'Hyderabad',
  'Mumbai',
  'Pune',
  'Delhi',
  'Jaipur',
  'Coimbatore'
];

export default function HomePage() {
  const router = useRouter();

  // Search Widget State
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [departureDate, setDepartureDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [seats, setSeats] = useState(1);

  // UI Dropdowns & Suggestion Panels
  const [isFromOpen, setIsFromOpen] = useState(false);
  const [isToOpen, setIsToOpen] = useState(false);
  const [isSeatsOpen, setIsSeatsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auth Modals State
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; name?: string; email?: string } | null>(null);

  const searchWidgetRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Initialize Supabase Auth listener
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          setUser({
            id: data.user.id,
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
            email: data.user.email
          });
        }
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email
          });
        } else {
          setUser(null);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchWidgetRef.current && !searchWidgetRef.current.contains(event.target as Node)) {
        setIsFromOpen(false);
        setIsToOpen(false);
        setIsSeatsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setIsUserMenuOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (fromCity.trim()) query.set('fn', fromCity.trim());
    if (toCity.trim()) query.set('tn', toCity.trim());
    if (departureDate) query.set('db', departureDate);
    if (seats) query.set('seats', String(seats));

    router.push(`/search?${query.toString()}`);
  };

  const handleSelectRouteChip = (from: string, to: string) => {
    setFromCity(from);
    setToCity(to);
    const query = new URLSearchParams({
      fn: from,
      tn: to,
      db: departureDate,
      seats: String(seats)
    });
    router.push(`/search?${query.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white selection:bg-[#00aff5]/20 selection:text-[#054752]">
      {/* 1. TOP NAVIGATION BAR */}
      <header className="h-20 border-b border-gray-100/90 flex items-center justify-between px-4 sm:px-8 max-w-7xl mx-auto w-full sticky top-0 bg-white/95 backdrop-blur-md z-40 transition-all">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00aff5] to-[#0098d6] flex items-center justify-center text-white shadow-md shadow-[#00aff5]/20 group-hover:scale-105 transition-transform">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tight text-[#00aff5] leading-none">
              Ride<span className="text-[#054752]">Together</span>
            </span>
            <span className="text-[10px] font-bold text-[#708c91] tracking-wider uppercase mt-0.5">
              Carpool India
            </span>
          </div>
        </Link>

        {/* Desktop Nav Actions */}
        <nav className="hidden md:flex items-center space-x-3">
          <Link
            href="/search"
            className="flex items-center gap-2 text-sm font-semibold text-[#054752] hover:text-[#00aff5] px-4 py-2.5 rounded-full hover:bg-slate-50 transition-colors"
          >
            <svg className="w-4 h-4 text-[#708c91]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Search</span>
          </Link>

          <Link
            href="/publish"
            className="flex items-center gap-2 text-sm font-semibold text-[#054752] hover:text-[#00aff5] px-4 py-2.5 rounded-full hover:bg-slate-50 transition-colors"
          >
            <span className="text-lg font-black text-[#00aff5] leading-none">+</span>
            <span>Offer a ride</span>
          </Link>

          <Link
            href="/driver"
            className="flex items-center gap-2 text-sm font-semibold text-[#054752] hover:text-[#00aff5] px-4 py-2.5 rounded-full hover:bg-slate-50 transition-colors"
          >
            <svg className="w-4 h-4 text-[#708c91]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
            <span>Driver Dashboard</span>
          </Link>

          {/* User Account / Auth Dropdown */}
          {user ? (
            <div className="relative pl-3 border-l border-gray-200" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-full hover:bg-slate-50 transition-all border border-transparent hover:border-gray-200 focus:outline-none"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#00aff5] to-cyan-400 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="text-xs font-bold text-[#054752] leading-tight">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-[#708c91]">
                    Verified Member
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-400 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Account Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs text-[#708c91]">Signed in as</p>
                    <p className="text-sm font-bold text-[#054752] truncate">{user.email}</p>
                  </div>

                  <Link
                    href="/driver"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-[#054752] hover:bg-slate-50 transition-colors"
                  >
                    <span>🚗</span>
                    <span>Driver Rides & Bookings</span>
                  </Link>

                  <Link
                    href="/publish"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-[#054752] hover:bg-slate-50 transition-colors"
                  >
                    <span>⚡</span>
                    <span>Offer a New Ride</span>
                  </Link>

                  <div className="border-t border-gray-100 my-1" />

                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2.5 pl-3 border-l border-gray-200">
              <button
                type="button"
                onClick={() => setIsLoginOpen(true)}
                className="text-sm font-bold text-[#054752] hover:text-[#00aff5] px-4 py-2 rounded-full hover:bg-slate-50 transition-colors"
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => setIsRegisterOpen(true)}
                className="text-sm font-bold text-white bg-[#00aff5] hover:bg-[#0098d6] px-5 py-2.5 rounded-full shadow-sm hover:shadow transition-all active:scale-95"
              >
                Sign up
              </button>
            </div>
          )}
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-[#054752] hover:bg-slate-100"
          aria-label="Toggle Navigation"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </header>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-6 py-4 space-y-3 animate-in slide-in-from-top-2 duration-150 z-30">
          <Link
            href="/search"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-sm font-bold text-[#054752] py-2"
          >
            Search Rides
          </Link>
          <Link
            href="/publish"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-sm font-bold text-[#00aff5] py-2"
          >
            + Offer a Ride
          </Link>
          <Link
            href="/driver"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-sm font-bold text-[#054752] py-2"
          >
            Driver Dashboard
          </Link>
          <div className="border-t border-gray-100 pt-3">
            {user ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-[#054752]">{user.name}</div>
                  <div className="text-xs text-[#708c91]">{user.email}</div>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-xs font-bold text-red-500 py-1 px-3 rounded-full border border-red-200"
                >
                  Log out
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsLoginOpen(true);
                  }}
                  className="flex-1 py-2.5 rounded-full border border-gray-300 text-sm font-bold text-[#054752]"
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsRegisterOpen(true);
                  }}
                  className="flex-1 py-2.5 rounded-full bg-[#00aff5] text-white text-sm font-bold"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. HERO SEARCH WIDGET SECTION */}
      <section className="relative bg-gradient-to-b from-[#eaf6fc] via-[#f4fafe] to-white pt-12 pb-20 sm:pt-20 sm:pb-28 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          {/* Main Hero Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#054752] tracking-tight leading-[1.15]">
            Your pick of rides at <span className="text-[#00aff5]">low prices</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[#708c91] max-w-2xl mx-auto font-medium">
            Carpool across India with trusted drivers. Save money on fuel and tolls while making comfortable journeys.
          </p>

          {/* Floating Pill-Rounded Search Bar Widget */}
          <div className="mt-10 max-w-4xl mx-auto" ref={searchWidgetRef}>
            <form
              onSubmit={handleSearchSubmit}
              className="bg-white rounded-[32px] shadow-[0_12px_36px_rgba(5,71,82,0.12)] border border-gray-100 p-2 sm:p-2.5 flex flex-col md:flex-row items-stretch gap-1.5 md:gap-0 relative z-20"
            >
              {/* Segment 1: Leaving from? */}
              <div className="relative flex-1 flex items-center px-4 py-3.5 rounded-2xl md:rounded-l-full hover:bg-slate-50 transition-colors border-b md:border-b-0 md:border-r border-gray-100">
                <svg className="w-5 h-5 text-[#708c91] mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle cx="12" cy="12" r="4" strokeWidth="2.5" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2v2m0 16v2m10-10h-2M4 12H2" />
                </svg>
                <div className="text-left w-full">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#708c91] leading-none mb-1">
                    Leaving from
                  </label>
                  <input
                    type="text"
                    placeholder="City or landmark"
                    value={fromCity}
                    onChange={e => {
                      setFromCity(e.target.value);
                      setIsFromOpen(true);
                    }}
                    onFocus={() => {
                      setIsFromOpen(true);
                      setIsToOpen(false);
                      setIsSeatsOpen(false);
                    }}
                    className="w-full bg-transparent text-sm sm:text-base font-bold text-[#054752] focus:outline-none placeholder-gray-400"
                  />
                </div>
                {fromCity && (
                  <button
                    type="button"
                    onClick={() => setFromCity('')}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    ✕
                  </button>
                )}

                {/* Suggestions Popover */}
                {isFromOpen && (
                  <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-30 text-left">
                    <div className="px-3.5 py-1.5 text-[11px] font-bold text-[#708c91] uppercase">
                      Suggested Cities
                    </div>
                    {CITY_SUGGESTIONS.filter(c => c.toLowerCase().includes(fromCity.toLowerCase())).map(city => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => {
                          setFromCity(city);
                          setIsFromOpen(false);
                        }}
                        className="w-full px-3.5 py-2 text-sm font-semibold text-[#054752] hover:bg-cyan-50 flex items-center gap-2 transition-colors"
                      >
                        <span className="text-[#00aff5]">📍</span>
                        <span>{city}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Segment 2: Going to? */}
              <div className="relative flex-1 flex items-center px-4 py-3.5 rounded-2xl hover:bg-slate-50 transition-colors border-b md:border-b-0 md:border-r border-gray-100">
                <svg className="w-5 h-5 text-[#708c91] mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div className="text-left w-full">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#708c91] leading-none mb-1">
                    Going to
                  </label>
                  <input
                    type="text"
                    placeholder="Destination city"
                    value={toCity}
                    onChange={e => {
                      setToCity(e.target.value);
                      setIsToOpen(true);
                    }}
                    onFocus={() => {
                      setIsToOpen(true);
                      setIsFromOpen(false);
                      setIsSeatsOpen(false);
                    }}
                    className="w-full bg-transparent text-sm sm:text-base font-bold text-[#054752] focus:outline-none placeholder-gray-400"
                  />
                </div>
                {toCity && (
                  <button
                    type="button"
                    onClick={() => setToCity('')}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    ✕
                  </button>
                )}

                {/* Suggestions Popover */}
                {isToOpen && (
                  <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-30 text-left">
                    <div className="px-3.5 py-1.5 text-[11px] font-bold text-[#708c91] uppercase">
                      Suggested Cities
                    </div>
                    {CITY_SUGGESTIONS.filter(c => c.toLowerCase() !== fromCity.toLowerCase() && c.toLowerCase().includes(toCity.toLowerCase())).map(city => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => {
                          setToCity(city);
                          setIsToOpen(false);
                        }}
                        className="w-full px-3.5 py-2 text-sm font-semibold text-[#054752] hover:bg-cyan-50 flex items-center gap-2 transition-colors"
                      >
                        <span className="text-[#00aff5]">📍</span>
                        <span>{city}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Segment 3: Date Picker */}
              <div className="relative flex-1 flex items-center px-4 py-3.5 rounded-2xl hover:bg-slate-50 transition-colors border-b md:border-b-0 md:border-r border-gray-100">
                <svg className="w-5 h-5 text-[#708c91] mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div className="text-left w-full">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#708c91] leading-none mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={departureDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setDepartureDate(e.target.value)}
                    className="w-full bg-transparent text-sm sm:text-base font-bold text-[#054752] focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Segment 4: Passenger Selector */}
              <div className="relative flex-none md:w-36 flex items-center px-4 py-3.5 rounded-2xl hover:bg-slate-50 transition-colors">
                <svg className="w-5 h-5 text-[#708c91] mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div
                  className="text-left cursor-pointer w-full"
                  onClick={() => setIsSeatsOpen(!isSeatsOpen)}
                >
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#708c91] leading-none mb-1 cursor-pointer">
                    Seats
                  </label>
                  <span className="text-sm sm:text-base font-bold text-[#054752]">
                    {seats} {seats === 1 ? 'person' : 'people'}
                  </span>
                </div>

                {/* Seat Selector Popover */}
                {isSeatsOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-30 text-left">
                    <span className="text-xs font-bold text-[#054752] block mb-2">Number of seats</span>
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setSeats(prev => Math.max(1, prev - 1))}
                        disabled={seats <= 1}
                        className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-lg font-bold text-[#00aff5] hover:bg-slate-100 disabled:opacity-30 transition-all"
                      >
                        −
                      </button>
                      <span className="font-extrabold text-lg text-[#054752]">{seats}</span>
                      <button
                        type="button"
                        onClick={() => setSeats(prev => Math.min(4, prev + 1))}
                        disabled={seats >= 4}
                        className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-lg font-bold text-[#00aff5] hover:bg-slate-100 disabled:opacity-30 transition-all"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="p-1 md:p-0 flex items-center">
                <button
                  type="submit"
                  className="w-full md:w-auto px-8 py-4 bg-[#00aff5] hover:bg-[#0098d6] text-white font-extrabold text-base rounded-2xl md:rounded-full transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:scale-95"
                >
                  <span>Search</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* 3. POPULAR ROUTES QUICK-SELECTION CHIPS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-10 w-full">
        <div className="text-center md:text-left mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-[#054752]">
            Popular Carpooling Routes
          </h2>
          <p className="text-xs sm:text-sm text-[#708c91] mt-1">
            Top scheduled carpool rides ready to book across India
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {POPULAR_ROUTES.map((route, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectRouteChip(route.from, route.to)}
              className="group p-4 bg-white rounded-2xl border border-gray-200/80 hover:border-[#00aff5] shadow-sm hover:shadow-md transition-all text-left flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2 text-base font-bold text-[#054752] group-hover:text-[#00aff5] transition-colors">
                  <span>{route.from}</span>
                  <span className="text-[#00aff5]">➔</span>
                  <span>{route.to}</span>
                </div>
                <div className="text-xs text-[#708c91] mt-1 font-medium">
                  Approx. {route.time} journey
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-[#708c91] block">from</span>
                <span className="text-lg font-black text-[#054752]">{route.price}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 4. TRUST & SAFETY VALUE PILLARS (BlaBlaCar Style) */}
      <section className="bg-slate-50/70 border-y border-gray-100 py-16 sm:py-24 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold text-[#00aff5] uppercase tracking-wider">
              Why Ride Together
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#054752] tracking-tight mt-1">
              Travel that connects and protects
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
            {/* Pillar 1 */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-50 text-[#00aff5] flex items-center justify-center text-2xl font-bold">
                🛡️
              </div>
              <h3 className="text-xl font-bold text-[#054752]">
                Your pick of rides at low prices
              </h3>
              <p className="text-sm text-[#708c91] leading-relaxed">
                Postcodes, profiles, and verified community reviews ensure you always know who you&apos;re travelling with. Enjoy reliable journeys without paying extortionate taxi fares.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-50 text-[#00aff5] flex items-center justify-center text-2xl font-bold">
                ⚡
              </div>
              <h3 className="text-xl font-bold text-[#054752]">
                Scroll, click, tap and go!
              </h3>
              <p className="text-sm text-[#708c91] leading-relaxed">
                Booking a ride has never been easier thanks to our simple app. Discover instant booking rides close to your neighborhood and get on the road in minutes.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl font-bold">
                🌱
              </div>
              <h3 className="text-xl font-bold text-[#054752]">
                Do your bit for the planet
              </h3>
              <p className="text-sm text-[#708c91] leading-relaxed">
                Carpooling makes intercity travel significantly more sustainable by pooling empty seats and sharing carbon footprints. Every shared ride avoids up to 71% in emissions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. DRIVER RECRUITMENT BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-20 w-full">
        <div className="bg-gradient-to-r from-[#054752] to-[#0a6675] rounded-[32px] p-8 sm:p-14 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="max-w-xl space-y-3 text-center md:text-left">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#00aff5]">
              Share your empty seats
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Driving somewhere soon? Let&apos;s ride together!
            </h2>
            <p className="text-sm sm:text-base text-slate-200">
              Publish your route in under 2 minutes. Cut your fuel and highway toll expenses in half while sharing pleasant conversation.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3.5 w-full md:w-auto">
            <Link
              href="/publish"
              className="py-4 px-8 rounded-full font-extrabold text-base bg-[#00aff5] hover:bg-[#0098d6] text-white text-center transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              Offer a ride
            </Link>
            <Link
              href="/driver"
              className="py-4 px-6 rounded-full font-bold text-sm bg-white/10 hover:bg-white/20 text-white text-center transition-all border border-white/20"
            >
              Driver Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="mt-auto border-t border-gray-100 bg-white py-12 px-4 sm:px-8 text-xs text-[#708c91]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-[#00aff5]">Ride<span className="text-[#054752]">Together</span></span>
            <span>• © 2026 Ride Together, Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 font-semibold">
            <Link href="/search" className="hover:text-[#054752] transition-colors">How it works</Link>
            <Link href="/publish" className="hover:text-[#054752] transition-colors">Offer seats</Link>
            <Link href="/driver" className="hover:text-[#054752] transition-colors">Driver portal</Link>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-1 font-bold text-[#054752]">
              🇮🇳 INR (₹) • English (IN)
            </span>
          </div>
        </div>
      </footer>

      {/* 7. AUTH MODALS */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={loggedUser => {
          setUser({
            id: loggedUser.id,
            name: loggedUser.user_metadata?.name || loggedUser.email?.split('@')[0],
            email: loggedUser.email
          });
          setIsLoginOpen(false);
        }}
        onSwitchToRegister={() => {
          setIsLoginOpen(false);
          setIsRegisterOpen(true);
        }}
      />

      <RegisterFlow
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={newUser => {
          setUser({
            id: newUser.id,
            name: newUser.user_metadata?.name || newUser.email?.split('@')[0],
            email: newUser.email
          });
          setIsRegisterOpen(false);
        }}
        onSwitchToLogin={() => {
          setIsRegisterOpen(false);
          setIsLoginOpen(true);
        }}
      />
    </div>
  );
}
