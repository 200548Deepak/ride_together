'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient, isSupabaseConfigured, getLocalUser } from '@/lib/supabaseClient';
import { DriverRideItem, DriverRideBooking } from '@/types/ride';
import PublishRideFlow from './PublishRideFlow';

interface DriverDashboardProps {
  onOpenLogin?: () => void;
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({ onOpenLogin }) => {
  const [rides, setRides] = useState<DriverRideItem[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; name?: string; email?: string } | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const supabase = getSupabaseClient();

  const fetchDriverRides = useCallback(async (driverId: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/rides?driver_id=${encodeURIComponent(driverId)}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setRides(data.rides || []);
      } else {
        // Fallback: direct Supabase select
        const { data: directRides } = await supabase
          .from('rides')
          .select(`
            *,
            vehicle:vehicle_id (
              id,
              make,
              model,
              color,
              license_plate
            ),
            waypoints:ride_waypoints (*),
            bookings:bookings (
              id,
              seats_reserved,
              total_price,
              currency,
              status,
              payment_method,
              created_at,
              passenger:passenger_id (
                id,
                name,
                email,
                phone,
                avatar_url,
                rating,
                ratings_count
              )
            )
          `)
          .eq('driver_id', driverId)
          .order('departure_time', { ascending: true });

        if (directRides) {
          setRides(directRides as DriverRideItem[]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch driver rides:', err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    // 1. Check local session
    const local = getLocalUser();
    if (local) {
      const u = {
        id: local.id,
        name: local.name || local.email?.split('@')[0] || 'Driver',
        email: local.email
      };
      setUser(u);
      fetchDriverRides(u.id);
    }

    // 2. Query Supabase auth if configured
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          const u = {
            id: data.user.id,
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Driver',
            email: data.user.email
          };
          setUser(u);
          fetchDriverRides(u.id);
        } else if (!local) {
          setIsLoading(false);
        }
      }).catch(() => {
        if (!local) setIsLoading(false);
      });
    } else if (!local) {
      setIsLoading(false);
    }
  }, [fetchDriverRides]);

  const handleBookingAction = async (bookingId: string, status: 'confirmed' | 'cancelled') => {
    setActionLoadingId(bookingId);
    setFeedbackMessage(null);

    try {
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId, status })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update booking');
      }

      setFeedbackMessage(`Booking has been ${status === 'confirmed' ? 'accepted' : 'declined'}.`);
      if (user) {
        fetchDriverRides(user.id);
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
            if (user) fetchDriverRides(user.id);
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
                Driver Hub
              </span>
              <span className="text-xs text-[#708c91]">Manage your carpooling activity</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#054752] mt-1 tracking-tight">
              {user ? `Welcome back, ${user.name}` : 'Driver Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPublishOpen(true)}
              className="py-3 px-6 rounded-full font-bold text-white bg-[#00aff5] hover:bg-[#0098d6] transition-all shadow-md hover:shadow-lg flex items-center gap-2 text-sm"
            >
              <span className="text-lg leading-none">+</span>
              <span>Publish a Ride</span>
            </button>
          </div>
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
              className="py-2.5 px-6 rounded-full font-bold text-white bg-[#00aff5] hover:bg-[#0098d6] text-xs transition-colors shadow"
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

        {/* Tabs: Upcoming vs Past Rides */}
        <div className="flex items-center gap-2 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab('upcoming')}
            className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors ${
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
            className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors ${
              activeTab === 'past'
                ? 'border-[#00aff5] text-[#00aff5]'
                : 'border-transparent text-[#708c91] hover:text-[#054752]'
            }`}
          >
            Past Rides ({pastRides.length})
          </button>
        </div>

        {/* Rides List */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-4 border-[#00aff5] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-[#708c91]">Loading your rides...</p>
          </div>
        ) : displayedRides.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm max-w-lg mx-auto">
            <div className="w-16 h-16 bg-cyan-50 text-[#00aff5] rounded-full flex items-center justify-center mx-auto text-2xl mb-4 font-bold">
              🚗
            </div>
            <h3 className="text-xl font-bold text-[#054752]">
              {activeTab === 'upcoming' ? 'No upcoming rides published' : 'No past ride history'}
            </h3>
            <p className="text-xs text-[#708c91] mt-1 max-w-sm mx-auto">
              {activeTab === 'upcoming'
                ? 'You do not have any rides scheduled right now. Publish your route to share fuel costs.'
                : 'Completed trips will appear here once finished.'}
            </p>
            <button
              type="button"
              onClick={() => setIsPublishOpen(true)}
              className="mt-6 py-3 px-6 rounded-full font-bold text-white bg-[#00aff5] hover:bg-[#0098d6] transition-all shadow text-sm"
            >
              Publish a ride now
            </button>
          </div>
        ) : (
          /* List of Rides */
          <div className="space-y-6">
            {displayedRides.map(ride => {
              const depDate = new Date(ride.departure_time);
              const formattedDate = depDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              });
              const formattedTime = depDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              });

              const bookings = ride.bookings || [];
              const pendingBookings = bookings.filter(b => b.status === 'pending');
              const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
              const seatsBookedCount = bookings.reduce(
                (sum, b) => (b.status === 'confirmed' ? sum + Number(b.seats_reserved) : sum),
                0
              );

              return (
                <div
                  key={ride.id}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md"
                >
                  {/* Ride Card Header */}
                  <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#708c91]">
                        <span className="text-[#00aff5] font-bold uppercase">{formattedDate}</span>
                        <span>•</span>
                        <span>Departure {formattedTime}</span>
                        {ride.instant_booking && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                            ⚡ Instant Booking
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xl font-black text-[#054752] mt-1.5">
                        <span>{ride.departure_city}</span>
                        <span className="text-[#00aff5]">➔</span>
                        <span>{ride.arrival_city}</span>
                      </div>

                      <p className="text-xs text-[#708c91] mt-0.5">
                        From: {ride.departure_location_name} | To: {ride.arrival_location_name}
                      </p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-2xl font-black text-[#054752]">
                          ₹{Number(ride.price_amount).toFixed(2)}
                        </div>
                        <div className="text-xs text-[#708c91]">per passenger</div>
                      </div>

                      <div className="text-right border-l border-gray-100 pl-6">
                        <div className="text-sm font-bold text-[#054752]">
                          {seatsBookedCount} / {ride.total_seats}
                        </div>
                        <div className="text-xs text-emerald-600 font-semibold">
                          {ride.available_seats} seat{ride.available_seats === 1 ? '' : 's'} left
                        </div>
                      </div>

                      <a
                        href={`/trip/${ride.multimodal_id || ride.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-[#00aff5] hover:bg-cyan-50 rounded-full transition-colors"
                        title="View public ride page"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>

                  {/* Waypoints Bar if any */}
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
                        No passengers have booked this ride yet. Seats are available to travelers searching this route.
                      </p>
                    ) : (
                      <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
                        {bookings.map((b: DriverRideBooking) => (
                          <div
                            key={b.id}
                            className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3">
                              {b.passenger?.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={b.passenger.avatar_url}
                                  alt={b.passenger.name}
                                  className="w-10 h-10 rounded-full object-cover bg-slate-100"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-slate-200 text-[#054752] font-bold flex items-center justify-center text-sm">
                                  {b.passenger?.name ? b.passenger.name[0] : 'P'}
                                </div>
                              )}

                              <div>
                                <div className="text-sm font-bold text-[#054752] flex items-center gap-2">
                                  <span>{b.passenger?.name || 'Passenger'}</span>
                                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-[#708c91]">
                                    {b.seats_reserved} seat{b.seats_reserved > 1 ? 's' : ''}
                                  </span>
                                </div>
                                <div className="text-xs text-[#708c91] mt-0.5">
                                  {b.passenger?.phone || b.passenger?.email || 'Verified user'} • ₹{Number(b.total_price).toFixed(2)} ({b.payment_method})
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {/* Status Badge */}
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

                              {/* Action buttons for pending requests */}
                              {b.status === 'pending' && (
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleBookingAction(b.id, 'confirmed')}
                                    disabled={actionLoadingId === b.id}
                                    className="px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleBookingAction(b.id, 'cancelled')}
                                    disabled={actionLoadingId === b.id}
                                    className="px-3 py-1 rounded-full border border-red-300 text-red-600 hover:bg-red-50 font-bold text-xs transition-colors"
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
    </div>
  );
};

export default DriverDashboard;

