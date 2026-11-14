'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getSupabaseClient, isSupabaseConfigured, getLocalUser, removeLocalUser } from '@/lib/supabaseClient';
import { getAuthToken, getAuthUser } from '@/lib/authClient';
import { DriverRideItem, DriverRideBooking } from '@/types/ride';
import PublishRideFlow from './PublishRideFlow';

interface DriverDashboardProps {
  onOpenLogin?: () => void;
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({ onOpenLogin }) => {
  const [rides, setRides] = useState<DriverRideItem[]>([]);
  const [passengerBookings, setPassengerBookings] = useState<any[]>([]);
  
  // Dashboard view mode: 'driver' (offered rides) | 'passenger' (my bookings)
  const [mode, setMode] = useState<'driver' | 'passenger'>('driver');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; name?: string; email?: string } | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const supabase = getSupabaseClient();

  const fetchDashboardData = useCallback(async (userId?: string, userEmail?: string) => {
    try {
      setIsLoading(true);

      if (userId || userEmail) {
        const token = getAuthToken();
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // 1. Fetch rides published by this user as driver ONLY
        const rideParams = new URLSearchParams();
        if (userId) rideParams.set('driver_id', userId);
        if (userEmail) rideParams.set('driver_email', userEmail);
        
        const res = await fetch(`/api/rides?${rideParams.toString()}`, { headers });
        const data = await res.json();
        if (res.ok && data.success) {
          setRides(data.rides || []);
        } else {
          setRides([]);
        }

        // 2. Fetch passenger bookings for this user ONLY
        const bookParams = new URLSearchParams();
        if (userId) bookParams.set('passenger_id', userId);
        if (userEmail) bookParams.set('passenger_email', userEmail);

        const bookRes = await fetch(`/api/bookings?${bookParams.toString()}`, { headers });
        const bookData = await bookRes.json();
        if (bookRes.ok && bookData.success) {
          setPassengerBookings(bookData.bookings || []);
        } else {
          setPassengerBookings([]);
        }
      } else {
        setRides([]);
        setPassengerBookings([]);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setRides([]);
      setPassengerBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Read query parameter ?mode=... if available
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const modeParam = urlParams.get('mode');
      if (modeParam === 'passenger' || modeParam === 'driver') {
        setMode(modeParam);
      }
    }

    const loadCurrentUser = () => {
      const local = getLocalUser();
      if (local) {
        const u = {
          id: local.id,
          name: local.name || local.email?.split('@')[0] || 'Member',
          email: local.email
        };
        setUser(u);
        fetchDashboardData(u.id, u.email);
        return u;
      } else {
        setUser(null);
        fetchDashboardData();
        return null;
      }
    };

    // 1. Check local session
    loadCurrentUser();

    // 2. Query Supabase auth if configured
    if (isSupabaseConfigured()) {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          const u = {
            id: data.user.id,
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Member',
            email: data.user.email
          };
          setUser(u);
          fetchDashboardData(u.id, u.email);
        }
      }).catch(() => {});
    }

    // 3. Listen for dynamic ride publication and authentication state changes
    const handleRidePublished = () => {
      const local = getLocalUser();
      fetchDashboardData(local?.id, local?.email);
    };

    const handleAuthChange = () => {
      loadCurrentUser();
    };

    window.addEventListener('ride-published', handleRidePublished);
    window.addEventListener('auth-change', handleAuthChange);

    return () => {
      window.removeEventListener('ride-published', handleRidePublished);
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, [fetchDashboardData, supabase.auth]);

  const handleBookingAction = async (bookingId: string, status: 'confirmed' | 'cancelled') => {
    setActionLoadingId(bookingId);
    setFeedbackMessage(null);

    try {
      const token = getAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ booking_id: bookingId, status })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update booking');
      }

      setFeedbackMessage(`Booking has been ${status === 'confirmed' ? 'accepted' : 'declined'}.`);
      if (user) {
        fetchDashboardData(user.id, user.email);
      }
    } catch (err: unknown) {
      setFeedbackMessage(err instanceof Error ? err.message : 'Error updating booking');
    } finally {
      setActionLoadingId(null);
    }
  };

  const now = new Date();
  const upcomingRides = rides.filter(r => new Date(r.departure_time) >= now);
  const pastRides = rides.filter(r => new Date(r.departure_time) < now);
  const displayedRides = activeTab === 'upcoming' ? upcomingRides : pastRides;

  // Aggregate Stats
  const totalRidesCount = rides.length;
  const totalBookings = rides.reduce((acc, r) => acc + (r.bookings?.filter(b => b.status === 'confirmed').length || 0), 0);
  const totalEarnings = rides.reduce((acc, r) => {
    const rideEarnings = (r.bookings || [])
      .filter(b => b.status === 'confirmed')
      .reduce((sum, b) => sum + Number(b.total_price), 0);
    return acc + rideEarnings;
  }, 0);

  if (isPublishOpen) {
    return (
      <div className="min-h-screen bg-[#f4f7f8] py-8 px-4 sm:px-6">
        <PublishRideFlow
          onSuccess={() => {
            setIsPublishOpen(false);
            const activeUser = getLocalUser();
            if (activeUser) fetchDashboardData(activeUser.id, activeUser.email);
            else fetchDashboardData();
          }}
          onCancel={() => setIsPublishOpen(false)}
          onOpenLogin={onOpenLogin}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7f8] text-[#054752] pb-16">
      {/* Top Banner & Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-cyan-100 text-[#00aff5]">
                {mode === 'driver' ? 'Driver Hub' : mode === 'passenger' ? 'Rider Bookings' : 'Community Rides'}
              </span>
              <span className="text-xs text-[#708c91]">
                {mode === 'driver' ? 'Manage your offered itineraries & passenger requests' : 'View and track all ride activity'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#054752] mt-1 tracking-tight">
              {user ? `Hello, ${user.name}` : 'Rides & Bookings Portal'}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <Link
              href="/"
              className="py-2.5 px-4 rounded-full font-bold text-[#054752] bg-slate-100 hover:bg-slate-200 transition text-sm flex items-center gap-1.5"
            >
              <span>🏠</span>
              <span>Home</span>
            </Link>

            <Link
              href="/search"
              className="py-2.5 px-4 rounded-full font-bold text-[#054752] bg-slate-100 hover:bg-slate-200 transition text-sm flex items-center gap-1.5"
            >
              <span>🔍</span>
              <span>Find Rides</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsPublishOpen(true)}
              className="py-2.5 px-5 rounded-full font-bold text-white bg-[#00aff5] hover:bg-[#0098d6] transition-all shadow-md hover:shadow-lg flex items-center gap-1.5 text-sm cursor-pointer"
            >
              <span className="text-lg leading-none">+</span>
              <span>Offer a Ride</span>
            </button>

            {user ? (
              <button
                type="button"
                onClick={() => {
                  removeLocalUser();
                  if (isSupabaseConfigured()) {
                    supabase.auth.signOut().catch(() => {});
                  }
                  setUser(null);
                  fetchDashboardData();
                }}
                className="py-2 px-3.5 rounded-full text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 transition cursor-pointer"
                title="Sign out of current account"
              >
                Sign out
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenLogin}
                className="py-2 px-3.5 rounded-full text-xs font-bold text-[#00aff5] hover:bg-cyan-50 border border-[#00aff5] transition cursor-pointer"
              >
                Sign in
              </button>
            )}
          </div>
        </div>

        {/* Primary View Switcher: Driver Offered | Passenger Bookings */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-2 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setMode('driver')}
            className={`pb-3.5 pt-2 px-4 font-extrabold text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              mode === 'driver'
                ? 'border-[#00aff5] text-[#00aff5]'
                : 'border-transparent text-[#708c91] hover:text-[#054752]'
            }`}
          >
            <span>🚗</span>
            <span>Driver Offered Rides ({rides.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('passenger')}
            className={`pb-3.5 pt-2 px-4 font-extrabold text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              mode === 'passenger'
                ? 'border-[#00aff5] text-[#00aff5]'
                : 'border-transparent text-[#708c91] hover:text-[#054752]'
            }`}
          >
            <span>🎫</span>
            <span>My Booked Rides ({passengerBookings.length})</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Unauthenticated Notification Banner */}
        {!user && !isLoading && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">🚗</span>
              <div>
                <h3 className="font-bold text-amber-900">Sign in to manage your rides</h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  Log in to see your published itineraries, view passengers, and manage booking requests.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenLogin}
              className="py-2.5 px-6 rounded-full font-bold text-white bg-[#00aff5] hover:bg-[#0098d6] text-xs transition-colors shadow cursor-pointer"
            >
              Log in / Register
            </button>
          </div>
        )}

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between">
            <span>{feedbackMessage}</span>
            <button
              type="button"
              onClick={() => setFeedbackMessage(null)}
              className="text-emerald-600 hover:text-emerald-900 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODE 1: DRIVER OFFERED RIDES                             */}
        {/* ======================================================== */}
        {mode === 'driver' && (
          <div className="space-y-6">
            {/* Informational banner if signed in user has 0 published driver rides */}
            {user && rides.length === 0 && !isLoading && (
              <div className="bg-cyan-50 border border-cyan-200 rounded-3xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-[#054752] text-base flex items-center gap-2">
                      <span>👋</span>
                      <span>Signed in as {user.name}</span>
                    </h3>
                    <p className="text-xs text-[#708c91] mt-1 leading-relaxed">
                      You haven&apos;t published any rides with this account yet. Share your empty seats, split travel costs, and travel comfortably.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsPublishOpen(true)}
                      className="px-5 py-2.5 rounded-full bg-[#00aff5] text-white text-xs font-bold hover:bg-[#008ecc] transition shadow-sm cursor-pointer"
                    >
                      Offer a Ride
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                <div className="text-xs font-bold text-[#708c91] uppercase tracking-wider">
                  Total Rides Published
                </div>
                <div className="text-3xl font-black text-[#054752] mt-2">
                  {totalRidesCount}
                </div>
                <div className="text-xs text-[#708c91] mt-1">
                  {upcomingRides.length} active scheduled
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                <div className="text-xs font-bold text-[#708c91] uppercase tracking-wider">
                  Passengers Transported
                </div>
                <div className="text-3xl font-black text-[#054752] mt-2">
                  {totalBookings}
                </div>
                <div className="text-xs text-emerald-600 font-semibold mt-1">
                  Confirmed community bookings
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                <div className="text-xs font-bold text-[#708c91] uppercase tracking-wider">
                  Total Travel Earnings
                </div>
                <div className="text-3xl font-black text-emerald-600 mt-2">
                  ₹{totalEarnings.toFixed(2)}
                </div>
                <div className="text-xs text-[#708c91] mt-1">
                  Cash & digital cost sharing
                </div>
              </div>
            </div>

            {/* Sub-tabs: Upcoming vs Past */}
            <div className="flex items-center gap-2 border-b border-gray-200">
              <button
                type="button"
                onClick={() => setActiveTab('upcoming')}
                className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'upcoming'
                    ? 'border-[#00aff5] text-[#00aff5]'
                    : 'border-transparent text-[#708c91] hover:text-[#054752]'
                }`}
              >
                Upcoming Rides ({upcomingRides.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('past')}
                className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'past'
                    ? 'border-[#00aff5] text-[#00aff5]'
                    : 'border-transparent text-[#708c91] hover:text-[#054752]'
                }`}
              >
                Past Rides ({pastRides.length})
              </button>
            </div>

            {/* Driver Rides List */}
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map(n => (
                  <div key={n} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm animate-pulse h-40" />
                ))}
              </div>
            ) : displayedRides.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-cyan-50 text-[#00aff5] flex items-center justify-center text-3xl mx-auto mb-4">
                  🚗
                </div>
                <h3 className="text-lg font-bold text-[#054752]">No {activeTab} rides published by this account</h3>
                <p className="text-sm text-[#708c91] max-w-md mx-auto mt-1 mb-6">
                  Ready to offer a ride? Share your empty seats, split fuel costs, and travel comfortably with verified passengers.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPublishOpen(true)}
                    className="py-3 px-6 rounded-full font-bold text-white bg-[#00aff5] hover:bg-[#0098d6] transition-colors shadow text-sm cursor-pointer"
                  >
                    Offer a ride now
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {displayedRides.map(ride => {
                  const depDate = new Date(ride.departure_time);
                  const arrDate = new Date(ride.arrival_time);
                  const bookings = ride.bookings || [];

                  return (
                    <div
                      key={ride.id}
                      className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-[#00aff5] uppercase tracking-wider">
                            {depDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </div>

                          <div className="text-xl font-black text-[#054752] flex items-center gap-2">
                            <span>{ride.departure_city}</span>
                            <span className="text-[#00aff5]">➔</span>
                            <span>{ride.arrival_city}</span>
                          </div>

                          <div className="text-xs text-[#708c91]">
                            {depDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} ({ride.departure_location_name}) — {arrDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} ({ride.arrival_location_name})
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-2xl font-black text-[#054752]">
                              ₹{ride.price_amount}
                            </div>
                            <div className="text-xs font-semibold text-emerald-600">
                              {ride.available_seats} seat{ride.available_seats === 1 ? '' : 's'} left
                            </div>
                          </div>

                          <Link
                            href={`/trip/${ride.multimodal_id || ride.id}`}
                            className="p-2.5 text-[#00aff5] hover:bg-cyan-50 rounded-full transition-colors border border-cyan-100"
                            title="View public ride page"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </Link>
                        </div>
                      </div>

                      {/* Waypoints */}
                      {ride.waypoints && ride.waypoints.length > 0 && (
                        <div className="px-6 py-2.5 bg-slate-50 border-b border-gray-100 text-xs text-[#708c91] flex items-center gap-2">
                          <span className="font-bold text-[#054752]">Stopovers:</span>
                          <span>{ride.waypoints.map(wp => wp.location_name).join(' → ')}</span>
                        </div>
                      )}

                      {/* Passenger Bookings Section */}
                      <div className="p-6 space-y-4">
                        <h4 className="text-xs font-bold text-[#708c91] uppercase tracking-wider">
                          Passenger Reservations ({bookings.length})
                        </h4>

                        {bookings.length === 0 ? (
                          <p className="text-xs text-[#708c91] italic">
                            No passengers have reserved seats on this ride yet. Travelers searching this route can book now.
                          </p>
                        ) : (
                          <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
                            {bookings.map((b: DriverRideBooking) => (
                              <div
                                key={b.id}
                                className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-slate-200 text-[#054752] font-bold flex items-center justify-center text-sm">
                                    {b.passenger?.name ? b.passenger.name[0] : 'P'}
                                  </div>
                                  <div>
                                    <div className="text-sm font-bold text-[#054752] flex items-center gap-2">
                                      <span>{b.passenger?.name || 'Passenger'}</span>
                                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-[#708c91]">
                                        {b.seats_reserved} seat{b.seats_reserved > 1 ? 's' : ''}
                                      </span>
                                    </div>
                                    <div className="text-xs text-[#708c91] mt-0.5">
                                      {b.passenger?.email || 'Verified Rider'} • ₹{Number(b.total_price).toFixed(2)} ({b.payment_method})
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span
                                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                                      b.status === 'confirmed'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : b.status === 'pending'
                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                        : 'bg-red-50 text-red-600 border border-red-200'
                                    }`}
                                  >
                                    {b.status.toUpperCase()}
                                  </span>

                                  {b.status === 'pending' && (
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleBookingAction(b.id, 'confirmed')}
                                        disabled={actionLoadingId === b.id}
                                        className="px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer"
                                      >
                                        Accept
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleBookingAction(b.id, 'cancelled')}
                                        disabled={actionLoadingId === b.id}
                                        className="px-3 py-1 rounded-full border border-red-300 text-red-600 hover:bg-red-50 font-bold text-xs transition-colors cursor-pointer"
                                      >
                                        Decline
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* MODE 2: PASSENGER BOOKED RIDES                           */}
        {/* ======================================================== */}
        {mode === 'passenger' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-[#054752]">My Bookings as a Rider</h2>
                <p className="text-xs text-[#708c91]">All your reserved carpool journeys across India</p>
              </div>
              <Link
                href="/search"
                className="py-2.5 px-5 rounded-full font-bold text-white bg-[#00aff5] hover:bg-[#0098d6] transition text-xs"
              >
                + Book Another Ride
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map(n => (
                  <div key={n} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm animate-pulse h-32" />
                ))}
              </div>
            ) : passengerBookings.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-cyan-50 text-[#00aff5] flex items-center justify-center text-3xl mx-auto mb-4">
                  🎫
                </div>
                <h3 className="text-lg font-bold text-[#054752]">No passenger reservations yet</h3>
                <p className="text-sm text-[#708c91] max-w-md mx-auto mt-1 mb-6">
                  Browse rides published by verified drivers, reserve your seat in seconds, and travel comfortably.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Link
                    href="/search"
                    className="py-3 px-6 rounded-full font-bold text-white bg-[#00aff5] hover:bg-[#0098d6] transition-colors shadow text-sm"
                  >
                    Find & Book Rides
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {passengerBookings.map(b => {
                  const ride = b.rides;
                  const depDate = ride?.departure_time ? new Date(ride.departure_time) : new Date();

                  return (
                    <div
                      key={b.id}
                      className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {b.status.toUpperCase()}
                          </span>
                          <span className="text-xs text-[#708c91]">
                            {depDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </span>
                        </div>

                        <div className="text-xl font-black text-[#054752] flex items-center gap-2">
                          <span>{ride?.departure_city || 'Origin'}</span>
                          <span className="text-[#00aff5]">➔</span>
                          <span>{ride?.arrival_city || 'Destination'}</span>
                        </div>

                        <div className="text-xs text-[#708c91]">
                          Driver: <strong className="text-[#054752]">{ride?.driver?.name || 'Verified Driver'}</strong> • {b.seats_reserved} seat{b.seats_reserved > 1 ? 's' : ''} reserved
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-black text-[#054752]">
                            ₹{b.total_price}
                          </div>
                          <div className="text-xs text-[#708c91]">
                            Payment: {b.payment_method}
                          </div>
                        </div>

                        {ride?.id && (
                          <Link
                            href={`/trip/${ride.id}`}
                            className="py-2.5 px-5 rounded-full font-bold text-xs bg-[#00aff5] text-white hover:bg-[#008ecc] transition shadow-sm"
                          >
                            View Itinerary
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;
