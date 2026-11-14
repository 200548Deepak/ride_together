'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAuthUser, clearAuth, onAuthChange, AuthUser } from '@/lib/authClient';
import AuthModal from './AuthModal';

export const Header: React.FC = () => {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    setCurrentUser(getAuthUser());
    const unsub = onAuthChange(u => setCurrentUser(u));

    // Fetch unread notification count
    const fetchNotifs = async () => {
      try {
        const res = await fetch('/api/notifications/count');
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.count || 0);
        }
      } catch {
        // silent
      }
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    clearAuth();
    setIsMenuOpen(false);
    router.push('/');
  };

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-2xl bg-[#00aff5] flex items-center justify-center text-white shadow-md shadow-cyan-100 group-hover:scale-105 transition-transform">
              {/* BlaBlaCar-style double-bubble carpool glyph */}
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="8" cy="12" r="5" />
                <circle cx="16" cy="12" r="5" fillOpacity="0.85" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-[#054752] tracking-tight group-hover:text-[#00aff5] transition-colors leading-none">
                Ride Together
              </span>
              <span className="text-[10px] font-bold text-[#708c91] tracking-wider uppercase mt-0.5">
                Carpool Network
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/search"
              className="flex items-center gap-2 px-3.5 py-2 rounded-full font-bold text-sm text-[#054752] hover:bg-slate-50 transition-colors"
            >
              <svg className="w-4 h-4 text-[#708c91]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search</span>
            </Link>

            <Link
              href="/offer-seats/departure"
              className="flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-sm text-[#00aff5] hover:bg-cyan-50 border border-transparent hover:border-cyan-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>Publish a ride</span>
            </Link>

            {/* Notification Bell (if logged in) */}
            {currentUser && (
              <Link
                href="/driver"
                className="relative p-2 rounded-full text-[#708c91] hover:text-[#054752] hover:bg-slate-100 transition-colors"
                title="Notifications"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}

            {/* User Profile / Login Button */}
            {currentUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(prev => !prev)}
                  className="flex items-center gap-2 p-1.5 pl-2.5 rounded-full border border-slate-200 hover:border-slate-300 transition-colors bg-white shadow-xs"
                >
                  <span className="text-xs font-bold text-[#054752] max-w-[100px] truncate hidden sm:inline">
                    {currentUser.name}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-cyan-100 text-[#00aff5] font-black text-sm flex items-center justify-center overflow-hidden border border-cyan-200">
                    {currentUser.avatar_url ? (
                      <img src={currentUser.avatar_url} alt={currentUser.name} className="w-full h-full object-cover" />
                    ) : (
                      currentUser.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <svg className="w-4 h-4 text-[#708c91] pr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-xs font-bold text-[#708c91] uppercase tracking-wider">Signed in as</p>
                      <p className="text-sm font-bold text-[#054752] truncate">{currentUser.name}</p>
                      <p className="text-xs text-[#708c91] truncate">{currentUser.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-50 text-[#00aff5]">
                        {currentUser.role} {currentUser.grade ? `• ${currentUser.grade}` : ''}
                      </span>
                    </div>

                    <Link
                      href="/driver"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full text-left px-4 py-2.5 text-sm font-semibold text-[#054752] hover:bg-slate-50 flex items-center gap-2.5"
                    >
                      <span>🚗</span>
                      <span>Your Rides & Bookings</span>
                    </Link>

                    <Link
                      href="/offer-seats/departure"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full text-left px-4 py-2.5 text-sm font-semibold text-[#054752] hover:bg-slate-50 flex items-center gap-2.5"
                    >
                      <span>➕</span>
                      <span>Publish a Ride</span>
                    </Link>

                    <div className="border-t border-gray-100 my-1" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors"
                    >
                      <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Log out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openAuth('login')}
                  className="px-4 py-2 rounded-full font-bold text-sm text-[#054752] hover:bg-slate-50 transition-colors"
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={() => openAuth('register')}
                  className="px-5 py-2 rounded-full font-bold text-sm text-white bg-[#00aff5] hover:bg-[#0098d6] shadow-sm hover:shadow transition-all"
                >
                  Sign up
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* JWT Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => setIsAuthModalOpen(false)}
      />
    </>
  );
};

export default Header;
